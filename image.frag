#define bs $bar_spacing
#define bw $bar_width
#define blk $background_color

const vec4 purple = vec4(198, 160, 246, 255);
const vec4 green = vec4(166, 218, 149, 255);
const vec4 blue = vec4(125, 196, 228, 255);
const vec4 orange = vec4(245, 169, 127, 255);
const vec4 red = vec4(237, 135, 150, 255);

const vec4 colors[] = vec4[](
    purple,
    green,
    blue,
    orange,
    orange,
    green,
    red,
    orange,
    purple,
    green,
    purple,
    orange,
    purple,
    red,
    orange,
    purple,
    orange,
    blue,
    orange,
    green,
    purple,
    blue,
    blue,
    orange
);

vec4 fetchAt(float i) {
    float w = iChannelResolution[1].x;
    float h = iChannelResolution[1].y;
    vec2 uv = vec2((i + 0.5) / w, 0.5 / h);
    return texture(iChannel2, uv);
}

vec4 mean(float _from, float _to)
{
    // if from > 1.0 (i.e. outside [0..1] in normalized space), return zero immediately:
    if (_from > 1.0) {
        return vec4(0.0);
    }

    float w   = iChannelResolution[1].x;
    float px0 = _from * w;
    float px1 = _to   * w;

    // left edge:
    float i0    = floor(px0);
    float frac0 = 1.0 - fract(px0);
    vec4 sum    = fetchAt(i0) * frac0;

    // sum all full texels between ceil(px0) .. floor(px1) (exclusive of fractional edges):
    for (float i = ceil(px0); i < floor(px1); i += 1.0) {
        sum += fetchAt(i);
    }

    // right edge:
    float i1    = floor(px1);
    float frac1 = fract(px1);
    if (i1 > i0) {
        // add the fractional piece at the right
        sum += fetchAt(i1) * frac1;
    } else {
        // if the entire range fits inside one pixel, subtract the “over‐count”
        sum -= fetchAt(i1) * (1.0 - frac1);
    }

    return sum / (px1 - px0);
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    float bar_spacing = bs / iResolution.x;
    float bar_width = bw / iResolution.x;
    float total_spacing = bar_spacing + bar_width;
    vec2 uv = fragCoord / iResolution.xy;
    float xMod = mod(uv.x, total_spacing);
    uv.y -= 0.5;
    uv.y *= 2.0;
    uv.y = abs(uv.y);
    float floorX = floor(uv.x / total_spacing) * total_spacing;
    float height = mean(floorX, floorX + total_spacing).r;

    float radius = bar_width * (iResolution.x / iResolution.y);
    if(height >= 0.001) height = max(height, radius);
    else {
        fragColor = vec4(0);
        return;
    }
    if(xMod < bar_spacing || xMod > bar_width + bar_spacing) {
        fragColor = blk;
        return;
    }
    int colid = int(floor(uv.x / total_spacing)) % colors.length();
    if(uv.y + radius > height && uv.y < height) {
        // We want to be a circle, so we can get our distance from the center of the bar where the circle would be
        // If the distance is greater than the radius, we can be set to 0
        float yMod = uv.y - (height - radius);
        // We can turn this into x with some basic trig
        yMod /= radius;
        float x = sqrt(1.0 - pow(yMod, 2.0));
        x = 1.0 - x;
        x *= bar_width;
        float xMod = mod(uv.x, total_spacing);
        xMod -= bar_spacing;
        // Figure out if we are within the range we should be
        if(xMod < x / 2.0 || xMod > bar_width - x / 2.0) fragColor = blk;
        else fragColor = colors[colid] / 255.0;
    }
    else if(height > uv.y) fragColor = colors[colid] / 255.0;
    else fragColor = blk;
}
