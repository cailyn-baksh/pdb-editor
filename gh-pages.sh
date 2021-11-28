#!/bin/bash

find . -type f -exec sed --regexp-extended -i "s|([\"'])(/.*\..*[\"'])|\\1/pdb-editor\\2|g" {} +

