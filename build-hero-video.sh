#!/usr/bin/env bash
#
# Rebuilds the looping hero background montage + poster from source clips.
#
# The source videos are NOT committed to the repo (too large). Point SRC at
# the folder that holds them, then run this script from anywhere:
#
#   ./build-hero-video.sh
#   SRC="/path/to/videos" ./build-hero-video.sh
#
# Output (committed): assets/hero-bg.mp4  and  assets/hero-poster.jpg
#
# Requires: ffmpeg (brew install ffmpeg)

set -euo pipefail

# --- config ------------------------------------------------------------------
SRC="${SRC:-$HOME/Desktop/Video}"                       # source clip folder
OUT="$(cd "$(dirname "$0")" && pwd)/assets"             # repo assets dir

# Each entry: "filename:start_seconds". 5 clips x 2.4s = 12.0s total.
# Order = the order they appear in the loop (industry montage).
CLIPS=(
  "5396825-uhd_3840_2160_30fps.mp4:0.8"   # urban / real-estate — city skyline
  "12518453_3840_2160_25fps.mp4:6"        # automotive / transport — night driving
  "6498978-uhd_3840_2160_25fps.mp4:5"     # tech / innovation — VR headset
  "7659657-uhd_3840_2160_25fps.mp4:1.5"   # corporate / teamwork — office
  "uhd_25fps.mp4:8"                        # fashion / media — studio shoot (vertical, center-cropped)
)
SEG=2.4            # seconds taken from each clip
# -----------------------------------------------------------------------------

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)"; exit 1; }

# Normalize every clip to 1920x1080 @30fps (cover + center-crop), no audio,
# then concat into one stream.
inputs=()
filters=""
labels=""
i=0
for entry in "${CLIPS[@]}"; do
  file="${entry%:*}"; start="${entry##*:}"
  path="$SRC/$file"
  [ -f "$path" ] || { echo "Missing source clip: $path"; exit 1; }
  inputs+=( -ss "$start" -t "$SEG" -i "$path" )
  filters+="[${i}:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30,format=yuv420p[v${i}];"
  labels+="[v${i}]"
  i=$((i+1))
done

echo "Building $OUT/hero-bg.mp4 ..."
ffmpeg -loglevel error -stats "${inputs[@]}" \
  -filter_complex "${filters}${labels}concat=n=${i}:v=1:a=0[outv]" \
  -map "[outv]" -an \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 26 -preset slow \
  -movflags +faststart "$OUT/hero-bg.mp4" -y

echo "Building $OUT/hero-poster.jpg ..."
ffmpeg -loglevel error -ss 0.6 -i "$OUT/hero-bg.mp4" -frames:v 1 \
  -vf "format=gray,scale=1280:-1" -q:v 4 "$OUT/hero-poster.jpg" -y

echo "Done:"
ls -lh "$OUT/hero-bg.mp4" "$OUT/hero-poster.jpg"
