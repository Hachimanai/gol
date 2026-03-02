/**
 * Shaders GLSL pour le rendu WebGL du Jeu de la Vie.
 */

export const GOL_VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;      // (0,0 à 1,1)
layout(location = 1) in vec2 a_instance_pos;  // (x,y) index
layout(location = 2) in float a_instance_state;

uniform vec2 u_grid_size;     // (cols, rows)
uniform vec2 u_resolution;    // (px_w, px_h)
uniform float u_cell_size;    // Taille d'une cellule en pixels
uniform float u_cell_spacing; // Espacement (%)

out float v_state;

void main() {
    v_state = a_instance_state;

    // Calcul de la taille de la grille totale en pixels
    vec2 total_grid_px = u_grid_size * u_cell_size;
    
    // Calcul de l'offset de centrage en pixels
    vec2 offset_px = floor((u_resolution - total_grid_px) / 2.0);

    // Position du point courant en pixels (depuis le haut-gauche)
    vec2 pos_px = offset_px + (a_instance_pos * u_cell_size) + (a_position * u_cell_size * (1.0 - u_cell_spacing));

    // Conversion pixels -> NDC (-1.0 à 1.0)
    // WebGL Y va de bas en haut, d'où le (1.0 - ratio)
    vec2 ndc = (pos_px / u_resolution) * 2.0 - 1.0;
    
    gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

export const GOL_FRAGMENT_SHADER = `#version 300 es
precision highp float;

in float v_state;
out vec4 outColor;

uniform vec3 u_alive_color;
uniform vec3 u_dead_color;

void main() {
    vec3 color = mix(u_dead_color, u_alive_color, v_state);
    outColor = vec4(color, 1.0);
}`;
