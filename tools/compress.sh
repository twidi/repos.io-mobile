#!/bin/bash

function jsmin {
    yui-compressor --type js $1 > $2
}  

function cssmin {
    yui-compressor --type css $1 > $2
}

version=`date +'%Y/%m/%d-%H%M%S'`
mkdir -p css/v/$version
mkdir -p js/v/$version

# compress js/lib/* to js/lib.min.js
export LANG=C; cat js/lib/*.js js/lib/*/*.js js/lib/*/*/*.js > js/lib.js
jsmin js/lib.js js/v/$version/lib.min.js
rm js/lib.js

# compress and concat some libs
for js_base_file in jQuery.unserializeForm jqm.page.params underscore gh3 classy screenfull marked jquery.around-the-fold jquery.scrollstop jstorage
do
    normal_file=js/resources/$js_base_file.js
    min_file=js/resources/$js_base_file.min.js
    if [ -e $normal_file ]
    then
        rm $min_file
        jsmin $normal_file $min_file
    fi
    cat $min_file >> js/v/$version/libraries.min.js
done

# concat css
cssmin css/resources/jqm-icon-pack-2.0-original.css css/resources/jqm-icon-pack-2.0-original.min.css
cssmin css/app.css css/v/$version/app.min.css

# min html parts
for i in 02 04 06 07 08
do
    normal_file=parts/$i.html
    min_file=`echo $normal_file | sed -e 's/.html/.min.html/'`
    tr -s '[:space:]' ' ' < $normal_file > $min_file
done

# concat inlines css and js
rm -f parts/03.* parts/05.*
cp css/_inline.css parts/03.debug.html
cssmin css/_inline.css parts/03.html
cp js/_inline.js parts/05.debug.html
jsmin js/_inline.js parts/05.html

# compute html pages
rm -f index.html debug.html
for i in 01 02 03 04 05 06 07 08
do
    base_file=parts/$i.html
    normal_file=parts/$i.min.html
    if [ ! -e $normal_file ]
    then
        normal_file=$base_file
    fi    
    debug_file=parts/$i.debug.html
    if [ ! -e $debug_file ]
    then
        debug_file=$base_file
    fi

    cat $normal_file >> index.html
    cat $debug_file >> debug.html
done

rm -f parts/*.min.html parts/03.* parts/05.*

sed -i -e "s|__VERSION__|$version|g" index.html debug.html

echo "OK for version '$version'"
