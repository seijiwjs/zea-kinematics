mkdir "../libs"

mkdir "../libs/zea-engine"
mklink /J "../libs/zea-engine/dist" "../../node_modules/@zeainc/zea-engine/dist"
mklink /J "../libs/zea-engine/public-resources" "../../node_modules/@zeainc/zea-engine/public-resources"

mkdir "../libs/zea-kinematics"
mklink /J "../libs/zea-kinematics/dist" "../../dist"

mkdir "../libs/zea-ux"
mklink /J "../libs/zea-ux/dist" "../../node_modules/@zeainc/zea-ux/dist"



pause