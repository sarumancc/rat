#!/bin/bash

# Verificar si los argumentos son correctos
if [ "$#" -ne 4 ]; then
    echo "Use: $0 <input_image> <thumbnail_size_XxY> <thumb_dir> <output_image>"
    exit 1
fi

# Inicializar variables
CURRENT_DATETIME=$(date +"%Y-%m-%d %H:%M:%S.%3N")
IMAGE_INPUT=$1
THUMB_SIZE=$2
IMAGE_OUTPUT=$4
THUMB_DIR=$3

echo -e "\n[$CURRENT_DATETIME] Executing thumbnail generator, thumbsize=$THUMB_SIZE"

#echo $THUMB_DIR/$IMAGE_OUTPUT

convert $IMAGE_INPUT -resize $THUMB_SIZE^ -gravity center -extent $THUMB_SIZE $THUMB_DIR/$IMAGE_OUTPUT

# Verificar si convert generó correctamente la imagen
if [ ! -f "$THUMB_DIR/$IMAGE_OUTPUT" ]; then
    echo -e "\n[$CURRENT_DATETIME] Error: convert don't generate thumbnail."
    exit 1
fi

echo -e "\n[$CURRENT_DATETIME] Thumbnail generator process complete."
