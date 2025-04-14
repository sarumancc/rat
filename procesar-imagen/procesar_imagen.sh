#!/bin/bash

# Verificar si al menos hay dos argumentos (imagen y tamaño de fuente)
if [ "$#" -lt 2 ]; then
    echo "Uso: $0 <input_image> <font_size> [opciones]"
    exit 1
fi

start=$(date +%s)
# Asignar argumentos a variables
ASTRO_GALLERY="/home/chupacabra/simpleastrometry/procesar-imagen/solve-images"
PLOT_TEMP="/home/chupacabra/simpleastrometry/plot-temp"
THUMB_DIR="/home/chupacabra/simpleastrometry/public/images/thumbnail"
IMAGEN_ENTRADA=$1
FONT_SIZE=$2
UNIXDATETIME=$(date +%s%3N)
ID_OUTPUT=$UNIXDATETIME
PLOT_OUTPUT="$ID_OUTPUT.plot.png"
WCS_OUTPUT="$ID_OUTPUT.wcs"
CURRENT_DATETIME=$(date +"%Y-%m-%d %H:%M:%S.%3N")

# Ignorar los dos primeros argumentos para que getopts funcione correctamente
shift 2  

# Parsear argumentos
while getopts "CNBb:cG:g:" opt; do
    case ${opt} in
    C) PLOT_OPTIONS+=" -C" ;;
    N) PLOT_OPTIONS+=" -N" ;;
    B) PLOT_OPTIONS+=" -B" ;;
    b) PLOT_OPTIONS+=" -b $OPTARG" ;;
    c) PLOT_OPTIONS+=" -c" ;;
    G) PLOT_OPTIONS+=" -G $OPTARG" ;;
    g) PLOT_OPTIONS+=" -g $OPTARG" ;;
    esac
done

# Obtener extension imagen
EXTENSION=$(basename "$IMAGEN_ENTRADA" | cut -d. -f2)

#echo $PLOT_OPTIONS
echo $ID_OUTPUT.$EXTENSION
echo $IMAGEN_ENTRADA

# Redirigir toda la salida a un archivo de log
exec > >(tee -a $ASTRO_GALLERY/$ID_OUTPUT.log) 2>&1

echo -e "\n[$CURRENT_DATETIME] Starting script"

# Crear copia para ser procesada
cp $IMAGEN_ENTRADA $ID_OUTPUT.$EXTENSION

# Obtener el ancho de la imagen
WIDTH=$(identify -format "%w" "$IMAGEN_ENTRADA")

# Determinar downsample basado en el ancho
if [ "$WIDTH" -ge 4000 ]; then
    DOWNSAMPLE=8
elif [ "$WIDTH" -ge 3000 ]; then
    DOWNSAMPLE=6
elif [ "$WIDTH" -ge 2000 ]; then
    DOWNSAMPLE=4
else
    DOWNSAMPLE=2
fi

echo -e "\n[$CURRENT_DATETIME] Using downsample=$DOWNSAMPLE for solve-field"

echo -e "\n[$CURRENT_DATETIME] Executing solve-field"
# Ejecutar solve-field para generar el archivo WCS
solve-field -p --downsample $DOWNSAMPLE --overwrite -l 1200 -D $PLOT_TEMP $ID_OUTPUT.$EXTENSION

# Verificar si solve-field pudo resolver
if [ ! -f "$PLOT_TEMP/$WCS_OUTPUT" ]; then
    echo -e "\n[$CURRENT_DATETIME] Error: solve-field can't resolve stars."
    rm $ID_OUTPUT.$EXTENSION
    rm $PLOT_TEMP/*.*
    exit 1
else
    cp $PLOT_TEMP/$WCS_OUTPUT $ASTRO_GALLERY/$ID_OUTPUT.wcs
    cp $IMAGEN_ENTRADA $ASTRO_GALLERY/$ID_OUTPUT.original.$EXTENSION
    rm $IMAGEN_ENTRADA
    rm $ID_OUTPUT.$EXTENSION
    rm $PLOT_TEMP/*.*
fi

echo -e "\n[$CURRENT_DATETIME] Initialization plot-constellation"
# Ejecutar plot-constellations con las opciones proporcionadas

/home/chupacabra/simpleastrometry/procesar-imagen/./constellations.sh -x $ASTRO_GALLERY/$ID_OUTPUT.original.$EXTENSION -z $ASTRO_GALLERY/$ID_OUTPUT.$EXTENSION -j $ASTRO_GALLERY/$ID_OUTPUT -w $ASTRO_GALLERY/$ID_OUTPUT.wcs -f $FONT_SIZE $PLOT_OPTIONS -o $ASTRO_GALLERY/$PLOT_OUTPUT

echo -e "\n[$CURRENT_DATETIME] Initialization thumb generator"

#echo $ASTRO_GALLERY/$ID_OUTPUT.$EXTENSION

/home/chupacabra/simpleastrometry/procesar-imagen/./thumb.sh $ASTRO_GALLERY/$ID_OUTPUT.$EXTENSION 256x256 $THUMB_DIR $ID_OUTPUT.$EXTENSION

echo -e "\n[$CURRENT_DATETIME] Cleaning temp files."
# Eliminar temporales y crear copia $ASTRO_GALLERY

end=$(date +%s)

# Mensaje de éxito
echo -e "[$CURRENT_DATETIME] Processing time $(expr $end - $start) seconds"
echo -e "[$CURRENT_DATETIME] Process completed. Image generated: $ID_OUTPUT.$EXTENSION."
