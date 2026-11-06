// Mask pass, commander only. Owner: Animations.
// Ported from Blacktop Aether tools/bake/godot/mask.gdshader, re-keyed to
// Character Dev's part maps (docs/COMMANDER_PIECES.md).
//
// This writes DATA, not a picture:
//   R  luminance (lit shading the tint multiplies)
//   G  part id, read from the piece's part map: 0 own colour, 64 pigment A,
//      128 pigment B, 192 skin, 255 hair
//   B  0 (reserved)
//   A  coverage, from the viewport
//
// ANTIALIASING MUST BE OFF and the part map is sampled NEAREST: a blended
// edge or a filtered texel invents an id between two real ones, which a
// threshold then reads as the wrong part (Blacktop measured this on lossy WebP).

shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_opaque, shadows_disabled;

uniform sampler2D base_tex : source_color, filter_linear;
uniform sampler2D part_tex : filter_nearest;
uniform bool has_tex = true;
uniform bool has_part = false;
uniform vec3 light_dir = vec3(-0.35, 0.72, 0.6);
uniform float ambient = 0.34;

void fragment() {
	float lam = max(dot(normalize(NORMAL), normalize(light_dir)), 0.0);
	float tex_v = has_tex ? dot(texture(base_tex, UV).rgb, vec3(0.299, 0.587, 0.114)) : 0.6;
	// never 0: a black pixel takes no tint at all (Blacktop's floor, 82/255)
	float lum = clamp((ambient + (1.0 - ambient) * lam) * mix(0.75, 1.25, tex_v), 82.0 / 255.0, 1.0);
	// snap to the five legal ids so nothing lands between two thresholds
	float raw = has_part ? texture(part_tex, UV).r * 255.0 : 0.0;
	float id = round(raw / 64.0) * 64.0;
	id = min(id, 255.0);
	ALBEDO = vec3(lum, id / 255.0, 0.0);
	ALPHA = 1.0;
}
