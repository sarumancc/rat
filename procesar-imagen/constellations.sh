#!/bin/bash

# Mostrar ayuda
usage() {
    echo "Uso: $0 -x <input_image> -z <output_image> -j <output.json> -w <input.wcs>-f <font_size> -o <output_file> [opciones]"
    echo "  -w <input.wcs>     Archivo WCS de entrada (obligatorio)"
    echo "  -f <size>         Tamaño de fuente (obligatorio)"
    echo "  -o <output_file>  Archivo de salida (obligatorio)"
    echo "  -C               Graficar constelaciones (opcional)"
    echo "  -N               Graficar objetos NGC (opcional)"
    echo "  -B               Graficar estrellas brillantes nombradas (opcional)"
    echo "  -b <N>           Graficar solo las N estrellas más brillantes (opcional)"
    echo "  -c               Solo graficar estrellas brillantes con nombres comunes (opcional)"
    echo "  -G <spacing>     Graficar la cuadrícula RA,Dec con espaciado especificado en arcmin (opcional)"
    echo "  -g <r:g:b>       Color de la cuadrícula en formato RGB (opcional)"
    exit 1
}

# Verificar si hay suficientes argumentos
if [ $# -lt 8 ]; then
    usage
fi

# Inicializar variables
CURRENT_DATETIME=$(date +"%Y-%m-%d %H:%M:%S.%3N")
OUTPUT_ID=""
INPUT_CONVERT=""
OUTPUT_CONVERT=""
INPUT_WCS=""
FONT_SIZE=""
PLOT_OUTPUT=""
PLOT_OPTIONS=""

# Parsear argumentos
while getopts "x:z:j:w:f:o:CNBb:cG:g:" opt; do
    case ${opt} in
    x) INPUT_CONVERT="$OPTARG" ;;
    z) OUTPUT_CONVERT="$OPTARG" ;;
    j) OUTPUT_ID="$OPTARG" ;;
    w) INPUT_WCS="$OPTARG" ;;
    f) FONT_SIZE="$OPTARG" ;;
    o) PLOT_OUTPUT="$OPTARG" ;;
    C) PLOT_OPTIONS+=" -C" ;;
    N) PLOT_OPTIONS+=" -N" ;;
    B) PLOT_OPTIONS+=" -B" ;;
    b) PLOT_OPTIONS+=" -b $OPTARG" ;;
    c) PLOT_OPTIONS+=" -c" ;;
    G) PLOT_OPTIONS+=" -G $OPTARG" ;;
    g) PLOT_OPTIONS+=" -g $OPTARG" ;;
    *) usage ;;
    esac
done

# Verificar que los parámetros obligatorios fueron proporcionados
if [ -z "$INPUT_CONVERT" ] || [ -z "$OUTPUT_CONVERT" ] || [ -z "$OUTPUT_ID" ] || [ -z "$INPUT_WCS" ] || [ -z "$FONT_SIZE" ] || [ -z "$PLOT_OUTPUT" ]; then
    echo "Error: Los parámetros -w, -f y -o son obligatorios."
    usage
fi

echo -e "\n[$CURRENT_DATETIME] Executing plot-constellation"
# Ejecutar plot-constellations
plot-constellations -w $INPUT_WCS -f $FONT_SIZE -o $PLOT_OUTPUT $PLOT_OPTIONS -J > plot.txt 2> plot.json

#awk 'BEGIN {start=0} /^\{/ {start=1} start' plot.txt >$OUTPUT_ID.txt
cp plot.json $OUTPUT_ID.json
cp plot.txt $OUTPUT_ID.txt
rm plot.json
rm plot.txt

# Verificar si plot-constellations generó correctamente la imagen
if [ ! -f "$PLOT_OUTPUT" ]; then
    echo -e "\n[$CURRENT_DATETIME] Error: plot-constellations don't generate plotting."
    exit 1
fi

echo -e "\n[$CURRENT_DATETIME] Executing convert."
# Fusionar la imagen generada con la imagen original
convert $INPUT_CONVERT $PLOT_OUTPUT -gravity center -composite $OUTPUT_CONVERT

# Verificar si la imagen final se creó correctamente
if [ ! -f "$OUTPUT_CONVERT" ]; then
    echo -e "\n[$CURRENT_DATETIME] Error: Can't generate final image."
    exit 1
fi

echo -e "\n[$CURRENT_DATETIME] plot-constellation process complete."
