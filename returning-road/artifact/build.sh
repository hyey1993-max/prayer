#!/usr/bin/env sh
# claude.ai 아티팩트로 올릴 파일을 dist-artifact/에 만든다.
# 결과: page.html(아티팩트 본문) + assets/*.js, *.css + PretendardVariable.woff2
set -e
cd "$(dirname "$0")/.."
npx tsc -b
# 공유 링크는 아티팩트 안쪽 주소가 아니라 claude.ai 링크를 가리켜야 한다
VITE_SHARE_URL="${VITE_SHARE_URL:-https://claude.ai/artifact/LKqLa8crynJ11PcaFNie5U}" npx vite build --mode artifact
cp node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2 dist-artifact/
JS=$(cd dist-artifact/assets && ls index-*.js)
CSS=$(cd dist-artifact/assets && ls index-*.css)
sed -e "s/__JS__/$JS/" -e "s/__CSS__/$CSS/" artifact/page.html > dist-artifact/page.html
find dist-artifact -type f | sort
