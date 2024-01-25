// https://pad.chesterip.cc/10540/

import { SingleBar } from "cli-progress";
import {
    copyFile,
    createWriteStream,
    existsSync,
    mkdirSync,
    readFileSync,
} from "node:fs";
import { get } from "node:https";
import { Card } from "./Card";

(async () => {
    // 読み込み
    const data: Map<
        number,
        {
            star: number;
            attr: string;
            image: string;
        }
    > = new Map();

    const data_impl: Card[] = JSON.parse(
        readFileSync("./data/format/data.json", "utf-8")
    );
    for (const item of data_impl) {
        if (item.id < 100000 && item.name !== "????") {
            data.set(item.id, {
                star: item.rarity,
                attr: item.attrs[0],
                image: `./data/format/monster/${item.id}.png`,
            });
        }
    }

    // starごとに分けて、フォルダに画像を保存

    // まず星ごとにimageを分割する
    const stars: Map<number, string[]> = new Map();
    for (const [_, value] of data) {
        if (stars.has(value.star)) {
            stars.get(value.star)?.push(value.image);
        } else {
            stars.set(value.star, [value.image]);
        }
    }

    // テスト用に1割りは別で持っておく
    const test = new Map();
    for (const [key, value] of stars) {
        // ランダムに100個の画像を選ぶ
        const images = JSON.parse(JSON.stringify(value));
        const test_images: string[] = [];
        // 1割をテスト用にする
        const test_num = Math.floor(images.length / 10);
        for (let i = 0; i < test_num; i++) {
            const index = Math.floor(Math.random() * images.length);
            test_images.push(images[index]);
            images.splice(index, 1);
        }
        test.set(key, test_images);
        // stars.set(key, images);
    }

    // 保存するフォルダを作成
    if (!existsSync("stars")) {
        mkdirSync("stars");
    }
    if (!existsSync("stars/images")) {
        mkdirSync("stars/images");
    }
    for (const [star, images] of stars) {
        const dir = `stars/images/★${star}`;
        await saveImages(star.toString(), images, dir);
    }
    if (!existsSync("stars/test")) {
        mkdirSync("stars/test");
    }
    if (!existsSync("stars/test/images")) {
        mkdirSync("stars/test/images");
    }
    for (const [star, images] of test) {
        const dir = `stars/test/images/★${star}`;
        await saveImages(star.toString(), images, dir);
    }

    // 属性ごとに分けて、フォルダに画像を保存
    const attrs: Map<string, string[]> = new Map();
    for (const [_, value] of data) {
        if (attrs.has(value.attr)) {
            attrs.get(value.attr)?.push(value.image);
        } else {
            attrs.set(value.attr, [value.image]);
        }
    }

    // テスト用に1割りは別で持っておく
    const test2 = new Map();
    for (const [key, value] of attrs) {
        // ランダムに100個の画像を選ぶ
        const images = JSON.parse(JSON.stringify(value));
        const test_images: string[] = [];
        // 1割をテスト用にする
        const test_num = Math.floor(images.length / 10);
        for (let i = 0; i < test_num; i++) {
            const index = Math.floor(Math.random() * images.length);
            test_images.push(images[index]);
            images.splice(index, 1);
        }
        test2.set(key, test_images);
        // attrs.set(key, images);
    }

    // 保存するフォルダを作成
    if (!existsSync("attrs")) {
        mkdirSync("attrs");
    }
    if (!existsSync("attrs/images")) {
        mkdirSync("attrs/images");
    }
    for (const [attr, images] of attrs) {
        const dir = `attrs/images/${attr}`;
        await saveImages(attr, images, dir);
    }
    if (!existsSync("attrs/test")) {
        mkdirSync("attrs/test");
    }
    if (!existsSync("attrs/test/images")) {
        mkdirSync("attrs/test/images");
    }
    for (const [attr, images] of test2) {
        const dir = `attrs/test/images/${attr}`;
        await saveImages(attr, images, dir);
    }

    for (const [star, images] of stars) {
        console.log(`★${star}: ${images.length}`);
    }
    for (const [attr, images] of attrs) {
        console.log(`${attr}: ${images.length}`);
    }
    console.log(`total: ${data.size}`);
})();

async function saveImages(star: string, images: string[], dir: string) {
    let progress = 0;
    const bar = new SingleBar({
        format: `★${star} [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}`,
    });
    bar.start(images.length, progress);

    if (!existsSync(dir)) {
        mkdirSync(dir);
    }

    // 保存
    const promises = (images as string[]).map((image) => {
        const file = `${dir}/${image.split("/").pop()}`;
        return (async (): Promise<void> => {
            if (!existsSync(file)) {
                copyFile(image, file, (err) => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
            progress += 1;
            bar.update(progress);
        })();
    });
    await Promise.all(promises);

    bar.stop();
}

function JSONtoMap(json: string) {
    const obj = JSON.parse(json);

    return new Map(Object.entries(obj));
}

function downloadImage(url: string, filepath: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(createWriteStream(filepath))
                    .on("error", reject)
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    .once("close", () => resolve(filepath as any));
            } else {
                // Consume response data to free up memory
                res.resume();
                console.log(res.statusCode);
                console.log(res.statusMessage);
                console.log(url, filepath);
                reject(
                    new Error(
                        `Request Failed With a Status Code: ${res.statusCode}`
                    )
                );
            }
        });
    });
}

// レア度
// トレーニング画像の個数
// ★1 : 29
// ★2 : 154
// ★3 : 473
// ★4 : 870
// ★5 : 1671
// ★6 : 2479
// ★7 : 2692
// ★8 : 1451
// ★9 : 557
// ★10: 413
// 計 :10789

// 属性
// トレーニング画像の個数
// fire: 2125
// water: 1889
// wood: 1893
// light: 2556
// dark: 2271
// null: 55
// 計: 10789
