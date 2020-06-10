#!/bin/bash

if [[ -z "$1" ]] ; then
    echo Usage: $(basename "$0") \<variant\>
    exit 1
fi

mkdir -p _out

JS="$(dirname "$0")"

javac -d "_out" "--class-path=$JS/../javascript:$JS/../java" "$JS/jstest/prefix/PostfixSumexpSoftmaxTest.java" \
    && java \
        -ea -XX:+UnlockExperimentalVMOptions -XX:+EnableJVMCI \
        "--module-path=$JS/graal" "--upgrade-module-path=$JS/graal/compiler.jar" \
        "--class-path=_out" jstest.prefix.PostfixSumexpSoftmaxTest "$1"
