#!/usr/bin/env bash
# Post-merge checks against the live canonical host.
# Do not run against production unless the site is already live and you intend to.
set -euo pipefail

CANONICAL="${CANONICAL:-https://www.commodityplay.ai}"
ALIAS="${ALIAS:-https://commodityplay.vercel.app}"

echo "==> 1. ${CANONICAL}/pricing"
code=$(curl -sS -o /dev/null -w "%{http_code}" "${CANONICAL}/pricing")
echo "    http_code=${code} (expect 200)"
[[ "${code}" == "200" ]]

echo "==> 2. ${ALIAS}/pricing → canonical"
redir=$(curl -sS -o /dev/null -w "%{http_code} %{redirect_url}" "${ALIAS}/pricing")
echo "    ${redir} (expect 308 ${CANONICAL}/pricing)"
echo "${redir}" | grep -q "^308 "
echo "${redir}" | grep -q "www.commodityplay.ai/pricing"

echo "==> 3. ${CANONICAL}/ redirect count"
chain=$(curl -sS -o /dev/null -w "redirects=%{num_redirects} final=%{url_effective}" -L "${CANONICAL}/")
echo "    ${chain} (expect redirects=0)"
echo "${chain}" | grep -q "redirects=0"

echo "==> 4. login-as-Frances → /admin 200"
echo "    Open ${CANONICAL}/login, sign in as the allowlisted admin, then:"
echo "    curl -sS -o /dev/null -w '%{http_code}\\n' -b cookies.txt ${CANONICAL}/admin"
echo "    expect 200 (unauthenticated /admin is 404 by design)"

echo
echo "Automated host checks passed. Complete step 4 in a browser."
