// 画像のサンプル数の正規化

import {
    copyFile,
    copyFileSync,
    existsSync,
    mkdir,
    mkdirSync,
    readdirSync,
} from "fs";
import { SingleBar } from "cli-progress";

export const normalization = async (dir: string) => {
    if (!existsSync(dir)) {
        throw new Error(`dir not found: ${dir}`);
    }

    const files = readdirSync(dir);
    const image_files: Map<string, string[]> = new Map();
    for (const file_name of files) {
        const file = `${dir}/${file_name}`;
        const images_files = readdirSync(file);
        const images = images_files.map((image_file) => {
            return `${file}/${image_file}`;
        });
        image_files.set(file, images);
        // console.log(file, images.length);
    }

    // 画像の数をある程度揃える
    const max = Math.max(
        ...[...image_files.values()].map((images) => images.length)
    );

    for (const image of image_files) {
        const images = image[1];
        if (images.length * 2 < max) {
            const diff = max - images.length;
            const repeat = Math.floor(diff / images.length);
            // const repeat = Math.round(diff / images.length);

            // console.log(image[0], images.length, repeat);

            for (let i = 0; i < repeat; i++) {
                image_files.set(image[0], [
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    ...image_files.get(image[0])!,
                    ...images,
                ]);
            }

            // console.log(
            //     "###",
            //     image[0],
            //     image[1].length,
            //     image_files.get(image[0])!.length
            // );
        }
    }

    for (const image of image_files) {
        console.log(image[0], image[1].length);
    }

    if (!existsSync("./normalization")) {
        mkdirSync("./normalization");
    }
    const parse = dir.split("/");
    for (let i = 0; i < parse.length; i++) {
        const path = parse.slice(0, i + 1).join("/");
        if (!existsSync(`./normalization/${path}`)) {
            mkdirSync(`./normalization/${path}`);
        }
    }

    // フォルダに画像を保存
    for (const image of image_files) {
        const dir = image[0];
        const images = image[1];
        let count = 0;
        const star = dir.split("/")[dir.split("/").length - 1];
        const bar = new SingleBar({
            format: `${star} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
        });
        bar.start(images.length, count);
        const promises = [];
        for (const image of images) {
            promises.push(
                (async (): Promise<void> => {
                    count += 1;
                    bar.update(count);
                    const split = image.split("/");
                    // console.log(dir, image, file_name);
                    const ext = split[split.length - 1].split(".");
                    const output = `./normalization/${dir}/${count}.${
                        ext[ext.length - 1]
                    }`;
                    if (!existsSync(`./normalization/${dir}`)) {
                        mkdirSync(`./normalization/${dir}`);
                    }
                    if (existsSync(output)) {
                        throw new Error(`output already found: ${output}`);
                    }
                    copyFileSync(image, output);
                })()
            );
        }
        await Promise.all(promises);
        bar.stop();
    }
};
