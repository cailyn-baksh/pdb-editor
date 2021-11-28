#!/bin/bash

if [ $1 == "push" ]; then
	find . -type f -exec sed --regexp-extended -i "s|([\"'])(/.*\..*[\"'])|\\1/pdb-editor\\2|g" {} +
elif [ $1 == "pull" ]; then
	find . -type f -exec sed --regexp-extended -i "s|([\"'])/pdb-editor(/.*\..*[\"'])|\\1\\2|g" {} +
else
	echo Option must be one of push, pull
fi

