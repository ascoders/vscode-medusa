import * as vscode from "vscode";

const chineseCharDecoration = vscode.window.createTextEditorDecorationType({
  borderWidth: "1px",
  borderStyle: "dotted",
  overviewRulerColor: "#fc363b",
  light: {
    borderColor: "#fc363b"
  },
  dark: {
    borderColor: "#fc363b"
  }
});

export const scannerLocales = (activeEditor: vscode.TextEditor) => {
  const targetStrs = [];

  // Inspide of https://github.com/FlyDreame/vue-i18n-helper/blob/5d0bb80524eea2829763795d93f15fcffbb156a4/src/utils/codeAction/updateDecorations.ts
  const possibleOccurenceEx = /(["'`])\s*(.+?)\s*\1|>\s*([^<{\)]+?)\s*[<{]/g;
  const hasCJKEx = /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uff1a\uff0c\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]|[\uff01-\uff5e\u3000-\u3009\u2026]/;
  const containsCommentEx = /\/\*\*/;
  const editorText = activeEditor.document.getText();
  const chineseChars: vscode.DecorationOptions[] = [];

  let match;
  while ((match = possibleOccurenceEx.exec(editorText))) {
    let isString = true;
    if (match[3]) {
      isString = false;
    }

    const m = match[3] || match[2];
    if (!m.match(hasCJKEx) || m.match(containsCommentEx)) {
      continue;
    }

    const leftTrim = match[0].replace(/^[>\s]*/m, "");
    const leftOffset = match[0].length - leftTrim.length;
    const finalMatch = m;

    const startPos = activeEditor.document.positionAt(
      match.index + leftOffset + (isString ? 1 : 0)
    );
    const endPos = activeEditor.document.positionAt(
      match.index + leftOffset + finalMatch.length + (isString ? 1 : 0)
    );
    const range = new vscode.Range(startPos, endPos);
    const decoration = {
      range,
      hoverMessage: "检测到中文"
    };

    targetStrs.push({
      text: finalMatch,
      range,
      isString
    });

    chineseChars.push(decoration);
  }

  activeEditor.setDecorations(chineseCharDecoration, chineseChars);

  return targetStrs;
};
