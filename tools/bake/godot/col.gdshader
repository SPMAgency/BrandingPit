// Colour pass: the fighter's own albedo, unlit. Owner: Animations.
// Ported from Blacktop Aether tools/bake/godot/col.gdshader.
//
// UNSHADED ON PURPOSE. The bake scene has no lights; a lit material with
// nothing lighting it renders solid black at a perfect silhouette (Blacktop's
// first production run: one unique RGB value across the whole sheet). The
// engine draws the outline; light comes from the baked shade term below,
// which is a data value, not a lighting rig.

shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_opaque, shadows_disabled;

uniform sampler2D base_tex : source_color, filter_linear;
uniform bool has_tex = true;
uniform vec4 base_color : source_color = vec4(0.8, 0.8, 0.8, 1.0);
// Gentle form shading so a 96 px figure reads as round, not flat. 0 = flat
// albedo. A key light from upper left, in view space.
uniform float shade = 0.35;
uniform vec3 light_dir = vec3(-0.35, 0.72, 0.6);

void fragment() {
	vec3 albedo = has_tex ? texture(base_tex, UV).rgb * base_color.rgb : base_color.rgb;
	float lam = max(dot(normalize(NORMAL), normalize(light_dir)), 0.0);
	ALBEDO = albedo * mix(1.0, 0.65 + 0.55 * lam, shade);
	ALPHA = 1.0;   // coverage comes from the viewport's own alpha
}
