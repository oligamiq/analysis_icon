import glob
import os
# python ./Puzzle-and-Dragons-Texture-Tool/PADTextureTool.py ./data/extract/mon2/cards_001.bc --outdir "./data/extract/mon2_extracted"

# ./data/extract/mon2/*.bcに対して、全て行う
# ファイルパスをすべて取得

images = glob.glob('./data/extract/mon2/cards*.bc')
print(len(images))

# 1つずつ、Puzzle-and-Dragons-Texture-Toolを実行する
for item in images:
    # print(item)
    cmd = 'python ./Puzzle-and-Dragons-Texture-Tool/PADTextureTool.py ' + item + ' --outdir "./data/extract/mon2_extracted/'
    # print(cmd)
    os.system(cmd)


