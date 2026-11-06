# Render a rigged fighter into sprite cells. Owner: Animations.
# Ported from Blacktop Aether tools/bake/godot/bake.gd; its measured fixes are
# kept and credited where they appear. Driven by tools/bake/bake.py.
#
# Contract: assets/atlases/layout.json (cell, directions, camera, clips) and a
# per-fighter spec in tools/bake/specs/<id>.json (which animation and which
# sample times make each clip's frames, height band, props).
#
# Output: <out>/<pass>/r{row}c{col}.png per cell, plus <out>/bake.json.
# Columns follow the layout's clip order for the spec's sheet.
#
# Modes
#   default   every clip of the sheet, every direction
#   --sweep=<anim>:<n>[:<row>]   n evenly spaced samples of one animation into
#             <out>/sweep/, for picking sample times (and contact) by eye
#
# What changed from Blacktop, and why
#   96x120 cells, 3 directions        the Animation Reboot plan's memory budget
#   fixed world scale                 Character Dev's height bands must survive:
#                                     each model is scaled to band x refHeightM
#                                     and one camera serves every fighter
#                                     (Blacktop fit each model to its own box)
#   camera pitch from layout.json     the board looks down ~44 deg, not 28
#   colour pass for fighters,         the plan: fighters show team by the ground
#   mask only for the commander       ring, so they ship one colour sheet
#   props on hand bones               Character Dev ships weapons as separate files
#   no part tagging by bone           fighters have no tint; the commander's ids
#                                     come from Character Dev's part maps

extends SceneTree

var failures: Array[String] = []
var notes: Array[String] = []


func _ck(ok: bool, msg: String) -> void:
	print("  [%s] %s" % ["PASS" if ok else "FAIL", msg])
	if not ok:
		failures.append(msg)


func _arg(key: String, dflt: String) -> String:
	for a in OS.get_cmdline_user_args():
		if a.begins_with(key + "="):
			return a.substr(key.length() + 1)
	return dflt


func _read_json(path: String) -> Variant:
	var f := FileAccess.open(path, FileAccess.READ)
	if f == null:
		_ck(false, "cannot open " + path)
		return null
	var d = JSON.parse_string(f.get_as_text())
	f.close()
	if d == null:
		_ck(false, "not valid JSON: " + path)
	return d


func _load_glb(path: String) -> Node:
	if not FileAccess.file_exists(path):
		_ck(false, "missing file: " + path)
		return null
	var doc := GLTFDocument.new()
	var state := GLTFState.new()
	if doc.append_from_file(path, state) != OK:
		_ck(false, "could not open " + path)
		return null
	return doc.generate_scene(state)


func _find(node: Node, type_name: String) -> Node:
	if node == null:
		return null
	if node.is_class(type_name):
		return node
	for c in node.get_children():
		var hit := _find(c, type_name)
		if hit != null:
			return hit
	return null


func _find_all(node: Node, type_name: String, out: Array) -> void:
	if node == null:
		return
	if node.is_class(type_name):
		out.append(node)
	for c in node.get_children():
		_find_all(c, type_name, out)


func _find_named(node: Node, nm: String) -> Node:
	if node == null:
		return null
	if String(node.name).to_lower() == nm:
		return node
	for c in node.get_children():
		var hit := _find_named(c, nm)
		if hit != null:
			return hit
	return null


# Mixamo bone names arrive as "mixamorig:RightHand", "mixamorig_RightHand" or
# "RightHand" depending on the exporter. Match on the suffix.
func _bone(skel: Skeleton3D, want: String) -> int:
	var b := skel.find_bone(want)
	if b != -1:
		return b
	for i in skel.get_bone_count():
		var n := skel.get_bone_name(i)
		if n.ends_with(":" + want) or n.ends_with("_" + want) or n == want:
			return i
	return -1


# Load every .glb in a folder into the character's library, re-pathing tracks
# onto THIS skeleton. Blacktop measured both failure modes this avoids: clips
# that bind nothing render the bind pose (three byte-identical cells), and
# non-root position tracks authored in centimetres explode the figure 100x.
func _inject_clips(dir_path: String, ap: AnimationPlayer, skel: Skeleton3D) -> void:
	var lib := ap.get_animation_library("")
	if lib == null:
		lib = AnimationLibrary.new()
		ap.add_animation_library("", lib)
	var d := DirAccess.open(dir_path)
	if d == null:
		return
	var root_bone := _root_bone(skel)
	for fn in d.get_files():
		if not fn.ends_with(".glb"):
			continue
		var extra := _load_glb(dir_path + "/" + fn)
		var eap := _find(extra, "AnimationPlayer") as AnimationPlayer
		if eap == null:
			continue
		for cn in eap.get_animation_list():
			var anim: Animation = eap.get_animation(cn).duplicate(true)
			var skel_path := ap.get_node(ap.root_node).get_path_to(skel)
			var bound := 0
			for ti in range(anim.get_track_count() - 1, -1, -1):
				var bone := String(anim.track_get_path(ti)).get_slice(":", 1)
				var bi := skel.find_bone(bone)
				if bone == "" or bi == -1:
					continue
				if anim.track_get_type(ti) == Animation.TYPE_POSITION_3D and bi != root_bone:
					anim.remove_track(ti)
					continue
				anim.track_set_path(ti, NodePath("%s:%s" % [skel_path, bone]))
				bound += 1
			var key := fn.get_basename()
			lib.add_animation(key, anim)
			_ck(bound > 0, "clip '%s' binds %d track(s)" % [key, bound])


func _root_bone(skel: Skeleton3D) -> int:
	var b := _bone(skel, "Hips")
	return b if b != -1 else (0 if skel.get_bone_count() > 0 else -1)


# Attach a prop glb to a bone. The prop carries an empty node named "grip"; the
# prop is placed so that grip sits on the bone's origin with the bone's axes.
func _attach_prop(skel: Skeleton3D, spec: Dictionary) -> void:
	var path := String(spec.get("file", ""))
	var prop := _load_glb(path)
	if prop == null:
		return
	var bone_name := String(spec.get("bone", "RightHand"))
	var bi := _bone(skel, bone_name)
	_ck(bi != -1, "prop %s: bone '%s' on the rig" % [path.get_file(), bone_name])
	if bi == -1:
		return
	var att := BoneAttachment3D.new()
	att.bone_name = skel.get_bone_name(bi)
	skel.add_child(att)
	var holder := Node3D.new()
	att.add_child(holder)
	holder.add_child(prop)
	var grip := _find_named(prop, "grip") as Node3D
	if grip != null:
		# the grip's transform relative to the prop root, inverted
		var rel := Transform3D.IDENTITY
		var n: Node = grip
		while n != null and n != prop:
			if n is Node3D:
				rel = (n as Node3D).transform * rel
			n = n.get_parent()
		holder.transform = rel.affine_inverse()
	else:
		notes.append("prop %s has no 'grip' node; attached at its origin" % path.get_file())
	# props are scaled with the character because they sit under its skeleton
	for m in _all_meshes(prop):
		m.set_meta("is_prop", true)


func _all_meshes(n: Node) -> Array[MeshInstance3D]:
	var out: Array[MeshInstance3D] = []
	var tmp: Array = []
	_find_all(n, "MeshInstance3D", tmp)
	for m in tmp:
		out.append(m as MeshInstance3D)
	return out


var untextured := false
var flat_colour := Color(0.8, 0.8, 0.8, 1.0)


func _material_for(m: MeshInstance3D, shader: Shader, part_tex: Texture2D) -> ShaderMaterial:
	var sm := ShaderMaterial.new()
	sm.shader = shader
	var src := m.get_active_material(0)
	var tex: Texture2D = null
	var col := flat_colour
	if src is BaseMaterial3D:
		tex = (src as BaseMaterial3D).albedo_texture
		if tex != null:
			col = (src as BaseMaterial3D).albedo_color
	if shader.resource_path.ends_with("col.gdshader"):
		print("    material on %s: %s, albedo texture %s" % [m.name,
			(src.get_class() if src != null else "<none>"), ("yes" if tex != null else "NONE")])
		if src != null and tex == null:
			# list what the material does carry, so a missing texture is attributable
			for prop in src.get_property_list():
				var v = src.get(prop["name"])
				if v is Texture2D:
					print("      texture in '%s'" % prop["name"])
	if tex == null and not m.has_meta("is_prop"):
		untextured = true
	sm.set_shader_parameter("has_tex", tex != null)
	if tex != null:
		sm.set_shader_parameter("base_tex", tex)
	if shader.get_mode() == Shader.MODE_SPATIAL and "base_color" in str(shader.code):
		sm.set_shader_parameter("base_color", col)
	if part_tex != null:
		sm.set_shader_parameter("part_tex", part_tex)
		sm.set_shader_parameter("has_part", true)
	return sm


func _init() -> void:
	var layout = _read_json(_arg("--layout", "res://layout.json"))
	var spec = _read_json(_arg("--spec", "res://spec.json"))
	var outdir := _arg("--out", "res://out")
	if layout == null or spec == null:
		_finish(outdir, {})
		return
	print("Godot ", Engine.get_version_info().string, "  fighter: ", spec.get("id", "?"))
	DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(outdir))

	var ch := _load_glb(String(spec.get("model", "")))
	if ch == null:
		_finish(outdir, {})
		return
	var skel := _find(ch, "Skeleton3D") as Skeleton3D
	var ap := _find(ch, "AnimationPlayer") as AnimationPlayer
	var meshes := _all_meshes(ch)
	_ck(skel != null, "Skeleton3D present")
	_ck(meshes.size() > 0, "at least one MeshInstance3D")
	if skel == null or meshes.is_empty():
		_finish(outdir, {})
		return
	if ap == null:
		ap = AnimationPlayer.new()
		ch.add_child(ap)
		ap.root_node = ap.get_path_to(ch)
	print("    skeleton bones %d, meshes %d" % [skel.get_bone_count(), meshes.size()])

	var clips_dir := String(spec.get("clips_dir", ""))
	if clips_dir != "":
		_inject_clips(clips_dir, ap, skel)
	for p in spec.get("props", []):
		_attach_prop(skel, p)
	meshes = _all_meshes(ch)

	# ---- render target: no antialiasing of any kind ------------------------
	var cw := int(layout["cell"]["w"])
	var chh := int(layout["cell"]["h"])
	var vp := SubViewport.new()
	vp.size = Vector2i(cw, chh)
	vp.transparent_bg = true
	vp.msaa_3d = Viewport.MSAA_DISABLED
	vp.screen_space_aa = Viewport.SCREEN_SPACE_AA_DISABLED
	vp.use_taa = false
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	get_root().add_child(vp)
	var turn := Node3D.new()      # turns for each direction
	vp.add_child(turn)
	var scaler := Node3D.new()    # the fixed world scale
	turn.add_child(scaler)
	if ch.get_parent() != null:   # generate_scene() returns an orphan (Blacktop)
		ch.get_parent().remove_child(ch)
	scaler.add_child(ch)

	# Defeat frustum culling when bone AABBs fail to build (Blacktop: two
	# characters rendered nothing behind a non-fatal "bs > sbs" warning).
	for m in meshes:
		m.custom_aabb = AABB(Vector3(-3, -3, -3), Vector3(6, 6, 6))
		m.extra_cull_margin = 8.0

	# ---- materials, per mesh so every piece and prop keeps its own texture ---
	var col_shader := load("res://col.gdshader") as Shader
	var mask_shader := load("res://mask.gdshader") as Shader
	_ck(col_shader != null and mask_shader != null, "shaders load")
	var part_tex: Texture2D = null
	if String(spec.get("part_map", "")) != "":
		var img := Image.load_from_file(String(spec["part_map"]))
		if img != null:
			part_tex = ImageTexture.create_from_image(img)
	var fc: Array = spec.get("flat_colour", [0.8, 0.8, 0.8])
	flat_colour = Color(float(fc[0]), float(fc[1]), float(fc[2]), 1.0)
	var mats := {"col": [], "mask": []}
	for m in meshes:
		mats["col"].append(_material_for(m, col_shader, null))
		mats["mask"].append(_material_for(m, mask_shader, part_tex))
	var sheet := String(spec.get("sheet", "fighter"))
	var passes: Array = layout["sheets"][sheet]["passes"]

	var cam := Camera3D.new()
	cam.projection = Camera3D.PROJECTION_PERSPECTIVE
	cam.fov = float(layout["camera"]["fovDeg"])
	vp.add_child(cam)
	cam.current = true
	await process_frame   # nodes must be inside the tree before transforms read

	# ---- fixed world scale --------------------------------------------------
	# Measure the rest-pose height from the meshes' world bounds, then scale the
	# model so it stands band x refHeightM. Every fighter then shares one
	# camera, and a 1.15 Mage stands 15% taller than a 1.00 Warrior on screen.
	var band := float(spec.get("band", 1.0))
	var ref_h := float(layout["cell"]["refHeightM"])
	var lo := INF
	var hi := -INF
	for m in meshes:
		if m.has_meta("is_prop"):
			continue
		var bb := m.get_aabb()
		for i in 8:
			var p: Vector3 = m.global_transform * bb.get_endpoint(i)
			lo = minf(lo, p.y)
			hi = maxf(hi, p.y)
	var raw_h := maxf(hi - lo, 0.0001)
	var s := band * ref_h / raw_h
	scaler.scale = Vector3(s, s, s)
	scaler.position.y = -lo * s      # rest-pose soles on y = 0
	print("    rest height %.3f units -> scaled x%.4f to %.2f m (band %.2f)" % [raw_h, s, band * ref_h, band])

	# ---- the camera, solved once from the reference height ------------------
	var pitch := deg_to_rad(-float(layout["camera"]["pitchDeg"]))   # elevation
	var foot_y := float(layout["cell"]["footY"])
	var body_px := float(layout["cell"]["bodyPx"])
	var view := Vector3(0.0, sin(pitch), cos(pitch))                 # from target to camera
	var target := Vector3(0.0, ref_h * 0.5, 0.0)
	var dist := (ref_h * 0.5) / tan(deg_to_rad(cam.fov) * 0.5) / (body_px / float(chh))
	for _i in 12:
		cam.global_position = target + view * dist
		cam.look_at(target, Vector3.UP)
		var pf := cam.unproject_position(Vector3.ZERO)
		var ph := cam.unproject_position(Vector3(0.0, ref_h, 0.0))
		var got := pf.y - ph.y
		var err := foot_y - pf.y
		if absf(got - body_px) < 0.25 and absf(err) < 0.25:
			break
		dist *= got / body_px
		# slide the aim point so the ground lands on the foot line; screen y
		# grows downward, so a positive error moves the aim point up
		var wpp := (2.0 * dist * tan(deg_to_rad(cam.fov) * 0.5)) / float(chh)
		target.y += err * wpp
	var pf2 := cam.unproject_position(Vector3.ZERO)
	var ph2 := cam.unproject_position(Vector3(0.0, ref_h, 0.0))
	_ck(absf(pf2.y - foot_y) < 1.0, "ground lands on the foot line (y=%.1f vs %d)" % [pf2.y, int(foot_y)])
	_ck(absf((pf2.y - ph2.y) - body_px) < 1.0, "a band-1.00 fighter stands %.1f px (target %d)" % [pf2.y - ph2.y, int(body_px)])

	var root_bone := _root_bone(skel)

	# ---- facing check -------------------------------------------------------
	# With an untextured or symmetrical model, front and back look alike on a
	# filmstrip, and a swapped pair would reverse every heading in the game. The
	# toes point forward on every Mixamo rig, so measure where they point after
	# each direction's turn, in screen terms: toward the camera, away, or right.
	var foot_bones := [_bone(skel, "LeftFoot"), _bone(skel, "RightFoot")]
	var toe_bones := [_bone(skel, "LeftToeBase"), _bone(skel, "RightToeBase")]
	if not (-1 in foot_bones or -1 in toe_bones):
		skel.reset_bone_poses()
		var facing := {}
		for d in layout["directions"]:
			turn.rotation = Vector3(0.0, deg_to_rad(float(d["yawDeg"])), 0.0)
			await process_frame
			var fwd := Vector3.ZERO
			for k in 2:
				var f: Vector3 = (skel.global_transform * skel.get_bone_global_pose(foot_bones[k])).origin
				var t: Vector3 = (skel.global_transform * skel.get_bone_global_pose(toe_bones[k])).origin
				fwd += t - f
			fwd.y = 0.0
			fwd = fwd.normalized()
			var to_cam := cam.global_position - turn.global_position
			to_cam.y = 0.0
			to_cam = to_cam.normalized()
			var right := cam.global_transform.basis.x
			facing[String(d["name"])] = {"toward": fwd.dot(to_cam), "right": fwd.dot(right)}
			print("    facing %-8s toward camera %+.2f, toward screen right %+.2f"
				% [d["name"], fwd.dot(to_cam), fwd.dot(right)])
		turn.rotation = Vector3.ZERO
		var y_ok := true
		for nm in facing.keys():
			var want_t := 1.0 if nm.begins_with("front") else (-1.0 if nm.begins_with("back") else 0.0)
			if absf(facing[nm]["toward"] - want_t * 0.7071) > 0.25 or facing[nm]["right"] < 0.5:
				y_ok = false
		_ck(y_ok, "directions face the way their names say (front toward the camera, back away, all toward screen right)")
	else:
		notes.append("no foot/toe bones: facing check skipped")

	# ---- what to render -------------------------------------------------------
	var jobs: Array = []   # {row, col, yaw, anim, at, clip, frame}
	var sweep := _arg("--sweep", "")
	if sweep != "":
		var parts := sweep.split(":")
		var n := int(parts[1]) if parts.size() > 1 else 20
		var row := int(parts[2]) if parts.size() > 2 else 0
		var yaw := float(layout["directions"][row]["yawDeg"])
		for i in n:
			jobs.append({"row": 0, "col": i, "yaw": yaw, "anim": parts[0],
				"at": float(i) / float(maxi(n - 1, 1)), "clip": "sweep", "frame": i})
		passes = ["col"]
	else:
		var colx := 0
		for clip in layout["sheets"][sheet]["clips"]:
			var nf := int(layout["clips"][clip]["frames"])
			var cs: Dictionary = spec["clips"].get(clip, {})
			var anim := String(cs.get("anim", ""))
			var ats: Array = cs.get("at", [])
			if anim == "" or not ap.has_animation(anim):
				_ck(false, "clip '%s': animation '%s' is not in the library" % [clip, anim])
				colx += nf
				continue
			if ats.is_empty():
				# even spacing: loops sample i/n so the cycle closes; one-shots
				# run first to last frame
				var loop := bool(cs.get("loop", false))
				for i in nf:
					ats.append(float(i) / float(nf) if loop else float(i) / float(maxi(nf - 1, 1)))
			_ck(ats.size() == nf, "clip '%s': %d sample times for %d frames" % [clip, ats.size(), nf])
			for d in layout["directions"]:
				for i in mini(nf, ats.size()):
					jobs.append({"row": int(d["row"]), "col": colx + i, "yaw": float(d["yawDeg"]),
						"anim": anim, "at": float(ats[i]), "clip": clip, "frame": i})
			colx += nf

	var index := {"id": spec.get("id", "?"), "sheet": sheet, "cells": [], "notes": notes,
		"band": band, "scale": s, "untextured": untextured}
	var empties := 0
	for j in jobs:
		turn.rotation = Vector3(0.0, deg_to_rad(float(j["yaw"])), 0.0)
		var anim: Animation = ap.get_animation(String(j["anim"]))
		ap.play(String(j["anim"]))
		# FREEZE TIME instead of stopping: a playing player advances by each
		# awaited frame's wall-clock delta (Blacktop: two identical bakes
		# differed in 380 of 380 cells). speed 0 keeps the bake reproducible.
		ap.speed_scale = 0.0
		ap.seek(anim.length * clampf(float(j["at"]), 0.0, 1.0), true)
		ap.advance(0.0)
		await process_frame
		# Pause, THEN pin the root's X/Z (in place), THEN give it a frame.
		# Pinning before the pause gets overwritten; pinning Y lifts a crouch
		# off the floor. Both measured in Blacktop.
		ap.pause()
		if root_bone >= 0:
			var rest := skel.get_bone_rest(root_bone).origin
			var now := skel.get_bone_pose_position(root_bone)
			skel.set_bone_pose_position(root_bone, Vector3(rest.x, now.y, rest.z))
			skel.force_update_all_bone_transforms()
		await process_frame
		for pass_name in passes:
			for k in meshes.size():
				meshes[k].material_override = mats[pass_name][k]
			await process_frame
			var img := vp.get_texture().get_image()
			var sub := "%s/%s" % [outdir, pass_name]
			DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(sub))
			img.save_png("%s/r%dc%d.png" % [sub, int(j["row"]), int(j["col"])])
			if pass_name == passes[0]:
				var cov := 0
				for y in range(0, chh, 3):
					for x in range(0, cw, 3):
						if img.get_pixel(x, y).a > 0.5:
							cov += 1
				if cov == 0:
					empties += 1
					print("    !! EMPTY: %s frame %d, row %d" % [j["clip"], j["frame"], j["row"]])
		index["cells"].append({"row": j["row"], "col": j["col"], "clip": j["clip"],
			"frame": j["frame"], "anim": j["anim"], "at": j["at"]})
	print("    rendered %d cell(s) x %d pass(es)" % [jobs.size(), passes.size()])
	_ck(jobs.size() > 0, "rendered at least one cell")
	_ck(empties == 0, "no cell rendered empty (%d empty)" % empties)
	_finish(outdir, index)


func _finish(outdir: String, index: Dictionary) -> void:
	index["failures"] = failures
	var f := FileAccess.open(outdir + "/bake.json", FileAccess.WRITE)
	if f != null:
		f.store_string(JSON.stringify(index, "  "))
		f.close()
	print("")
	if failures.is_empty():
		print("BAKE PASSED")
		quit(0)
	else:
		print("BAKE FAILED: %d" % failures.size())
		for m in failures:
			print("  - " + m)
		quit(1)
