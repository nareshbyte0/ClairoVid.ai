import "../src/db/indexes";
import { ensureIndexes } from "../src/db/indexes";
ensureIndexes().then(()=>{process.stdout.write("ClairoVid application indexes are ready.\n");process.exit(0);}).catch(()=>{process.stderr.write("Could not provision application indexes. Check the database configuration.\n");process.exit(1);});
