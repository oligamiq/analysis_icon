import { normalization } from "./normalization";

(async () => {
    await normalization("./stars/images");
    await normalization("./attrs/images");
})();
