#!/usr/bin/env bash

project_dir=$(pwd)

autopep8 $project_dir --recursive --in-place --pep8-passes 2000 --verbose
