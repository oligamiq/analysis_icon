// 元は1014*1014の画像
// 96 * 96の画像に分ける
// 画像と画像の間の幅は6px
// 96 * 10 + 6 * 9 = 1014

import { SingleBar } from "cli-progress";
import { create } from "lodash";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { exit } from "node:process";
import sharp from "sharp";

(async () => {
    const outputDir = "./data/format/monster";

    // data/extract/mon2_extracted配下の*.pngファイルを読み込む
    const files = readdirSync("./data/extract/mon2_extracted");

    let count = 1;

    const bar = new SingleBar({
        format: "CLI Progress | {bar} | {percentage}% || {value}/{total}",
        barCompleteChar: "\u2588",
        barIncompleteChar: "\u2591",
        hideCursor: true,
    });

    bar.start(files.length * 10 * 10, 0);

    if (!existsSync(outputDir)) {
        mkdirSync(outputDir);
    }

    const data_map: Map<
        string,
        {
            left_margin?: number;
            top_margin?: number;
            max_y?: number;
            max_x?: number;
            last?: boolean;
        }
    > = new Map();
    data_map.set("CARDS_003.PNG", {
        left_margin: 1,
    });
    data_map.set("CARDS_045.PNG", {
        top_margin: -4,
    });
    data_map.set("CARDS_055.PNG", {
        top_margin: -2,
    });
    data_map.set("CARDS_062.PNG", {
        top_margin: -4,
    });
    // 068はヤバ過ぎたので直接直した
    data_map.set("CARDS_080.PNG", {
        top_margin: -2,
    });
    data_map.set("CARDS_081.PNG", {
        top_margin: -3,
    });
    data_map.set("CARDS_084.PNG", {
        top_margin: -2,
    });
    data_map.set("CARDS_088.PNG", {
        top_margin: -6,
    });
    data_map.set("CARDS_104.PNG", {
        top_margin: -5,
    });
    data_map.set("CARDS_106.PNG", {
        max_y: 4,
    });
    data_map.set("CARDS_108.PNG", {
        top_margin: -3,
    });
    data_map.set("CARDS_110.PNG", {
        max_y: 1,
        max_x: 5,
        last: true,
    });

    for (const file of files) {
        const p = path.join("./data/extract/mon2_extracted", file);
        const image = sharp(p);

        const metadata = await image.metadata();
        const width = metadata.width ?? 0;
        const height = metadata.height ?? 0;

        const left_margin = data_map.get(file)?.left_margin ?? 0;
        const top_margin = data_map.get(file)?.top_margin ?? 0;
        const max_y = data_map.get(file)?.max_y ?? 10;
        const max_x = data_map.get(file)?.max_x ?? 10;
        const last = data_map.get(file)?.last ?? false;

        if (width !== 1014 || height !== 1014) {
            if (data_map.has(file)) {
                console.log(`\n${file} adjust margin`);
            } else {
                console.log(`\n${file} is not 1014*1014`);
                exit(1);
            }
        }

        if (!last) {
            count += (10 - max_y) * 10;
        }

        // 画像を分割する
        for (let y = 0; y < max_y; y++) {
            for (let x = 0; x < max_x; x++) {
                const clone_img = image.clone();
                const left = x * 96 + x * 6 + left_margin;
                let top = y * 96 + y * 6;
                if (top_margin < 0 && y !== 0) {
                    top += top_margin;
                }
                const right = (x + 1) * 96 + x * 6 + left_margin;
                let bottom = (y + 1) * 96 + y * 6;
                if (top_margin < 0) {
                    bottom += top_margin;
                }
                if (y === 9) {
                    if (bottom !== height) {
                        console.log(`\n${file} is cannot adjust _*${height}`);
                        console.log(`bottom: ${bottom}`);
                    }
                }
                if (x === 9) {
                    if (right !== width) {
                        console.log(`\n${file} is cannot adjust ${width}*_`);
                        console.log(`right: ${right}`);
                    }
                }
                const result = await clone_img.extract({
                    left,
                    top,
                    width: right - left,
                    height: bottom - top,
                });

                // もしresultの範囲の画像が空白ならスキップする
                const isTransparent = await checkTransparent(result);
                if (!isTransparent) {
                    const old_width = right - left;
                    const old_height = bottom - top;
                    if (old_width !== 96 || old_height !== 96) {
                        result.resize(96, 96, {
                            fit: "contain",
                            background: { r: 0, g: 0, b: 0, alpha: 0 },
                        });
                    }
                    await result.toFile(path.join(outputDir, `${count}.png`));
                } else {
                    console.log(`\n${count} is transparent`);
                }
                count += 1;
                bar.increment();
            }
        }
    }

    bar.stop();
})();

async function checkTransparent(image: sharp.Sharp) {
    const buffer = await image
        .clone()
        .raw()
        .toBuffer({ resolveWithObject: true });
    const { data, info } = buffer;
    const { width, height, channels } = info;
    const bytesPerPixel = channels;

    // Check if all pixels are transparent
    for (let i = 3; i < data.length; i += bytesPerPixel) {
        if (data[i] !== 0) {
            // If any non-zero alpha channel is found, the image is not fully transparent
            return false;
        }
    }
    return true;
}
