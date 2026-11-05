import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

// Carga el .env de la raíz del repo sin importar desde qué carpeta se ejecute.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });
