// https://github.com/kiootic/pad-rikuu/blob/bd1d44eb4b2d0aabb82b15bb5c2c09afe1a988b2/modules/data-get/src/stages/parse-cards.ts

import { compact, range } from "lodash";
import { readFileSync, writeFileSync } from "node:fs";

/* tslint:disable:no-bitwise */

function parseCard(data: any[]) {
    const card: any = {
        attrs: [],
        types: [],
    };
    let i = 0;

    function readCurve() {
        return {
            min: data[i++],
            max: data[i++],
            scale: data[i++],
        };
    }

    card.id = data[i++];
    if (card.id >= 10000 && card.id < 100000) card.id -= 100;
    card.name = data[i++];
    card.attrs.push(data[i++]);
    card.attrs.push(data[i++]);

    card.isUltEvo = data[i++] !== 0;

    card.types.push(data[i++]);
    card.types.push(data[i++]);

    card.rarity = data[i++];
    card.cost = data[i++];
    card.unk01 = data[i++];
    card.maxLevel = data[i++];
    card.feedExp = data[i++];
    card.isEmpty = data[i++] === 1;
    card.sellPrice = data[i++];

    card.hp = readCurve();
    card.atk = readCurve();
    card.rcv = readCurve();
    card.exp = { min: 0, max: data[i++], scale: data[i++] };

    card.activeSkillId = data[i++];
    card.leaderSkillId = data[i++];

    card.enemy = {
        countdown: data[i++],
        hp: readCurve(),
        atk: readCurve(),
        def: readCurve(),
        maxLevel: data[i++],
        coin: data[i++],
        exp: data[i++],
    };

    card.evoBaseId = data[i++];
    card.evoMaterials = [data[i++], data[i++], data[i++], data[i++], data[i++]];
    card.unevoMaterials = [
        data[i++],
        data[i++],
        data[i++],
        data[i++],
        data[i++],
    ];
    card.unk02 = data[i++];
    card.unk03 = data[i++];
    card.unk04 = data[i++];
    card.unk05 = data[i++];
    card.unk06 = data[i++];
    card.unk07 = data[i++];

    const numSkills = data[i++];
    card.enemy.skills = range(numSkills).map(() => ({
        id: data[i++],
        ai: data[i++],
        rnd: data[i++],
    }));

    const numAwakening = data[i++];
    card.awakenings = range(numAwakening).map(() => data[i++]);

    card.superAwakenings = compact(data[i++].split(",")).map(Number);
    card.evoRootId = data[i++];
    card.seriesId = data[i++];
    card.types.push(data[i++]);
    card.sellMP = data[i++];
    card.latentAwakeningId = data[i++];
    card.collabId = data[i++];
    const flags = data[i++];
    card.canAssist = (flags & 1) !== 0;
    card.enabled = (flags & (1 << 1)) !== 0;
    card.is9Latent = (flags & (1 << 5)) !== 0;
    card.skillBanner = (flags & (1 << 6)) !== 0;

    card.altName = data[i++];
    card.limitBreakIncr = data[i++];
    card.voiceId = data[i++];
    card.blockSkinOrBgmId = data[i++];
    card.specialAttribute = data[i++];
    card.searchFlags = [data[i++], data[i++]];
    card.gachaId = data[i++];
    card.unk08 = data[i++];
    card.attrs.push(data[i++]);

    if (i !== data.length)
        console.log(`residue data for #${card.id}: ${i} ${data.length}`);

    // -1になる前まで
    card.attrs = card.attrs.filter((attr: number) => attr !== -1);

    card.attrs = card.attrs.map((attr: number) => {
        switch (attr) {
            case 0:
                return "fire";
            case 1:
                return "water";
            case 2:
                return "wood";
            case 3:
                return "light";
            case 4:
                return "dark";
            case 6:
                return "null";
            default:
                throw new Error(`unknown attr: ${attr}`);
        }
    });
    return card;
}

export async function parseCards() {
    const data: { card: any[]; v: number } = JSON.parse(
        readFileSync(`./data/extract/ja-card.json`, "utf8")
    );
    console.log(`parsing ${data.card.length} cards (version ${data.v})...`);

    const cards = data.card.map((card: any) => parseCard(card));
    writeFileSync("./data/format/data.json", JSON.stringify(cards, null, 4));
    return true;
}

function typeToString() {}
