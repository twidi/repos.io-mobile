#!/bin/bash

# compress js/lib/* to js/lib.min.js
export LANG=C; cat js/lib/*.js js/lib/*/*.js js/lib/*/*/*.js > js/lib.js
slimit -m js/lib.js > js/lib.min.js
rm js/lib.js

# concat some libs
cd js/resources
rm -f libraries.min.js
grep -v '^[\/\*]' jQuery.unserializeForm.min.js >> libraries.min.js
grep -v '^[\/\*]' jqm.page.params.min.js >> libraries.min.js
grep -v '^[\/\*]' underscore-min.js >> libraries.min.js
grep -v '^[\/\*]' gh3.min.js >> libraries.min.js
grep -v '^[\/\*]' classy.min.js >> libraries.min.js
grep -v '^[\/\*]' screenfull.min.js >> libraries.min.js
grep -v '^[\/\*]' marked.min.js >> libraries.min.js

