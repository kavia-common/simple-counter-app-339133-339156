#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-counter-app-339133-339156/counter_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

