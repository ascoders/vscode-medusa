"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { scannerLocales } from "./scanner-locales";
import { searchLocales } from "./search-locales";

const open = require("opn");

function isTsFile(document: vscode.TextDocument) {
  return (
    document.uri.fsPath.endsWith(".ts") || document.uri.fsPath.endsWith(".tsx")
  );
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let targetStrs: Array<{
    text: string;
    range: vscode.Range;
    isString: boolean;
  }> = [];

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (!editor) {
        return;
      }

      if (!isTsFile(editor.document)) {
        return;
      }

      targetStrs = scannerLocales(editor);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      if (!vscode.window.activeTextEditor) {
        return;
      }

      if (!isTsFile(vscode.window.activeTextEditor.document)) {
        return;
      }

      targetStrs = scannerLocales(vscode.window.activeTextEditor);
    })
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      ["typescriptreact", "typescript", "javascriptreact", "javascript"],
      {
        provideCodeActions: async (document, range, context, token) => {
          if (!isTsFile(document)) {
            return;
          }

          const targetStr = targetStrs.find(
            eachTarget => range.intersection(eachTarget.range) !== undefined
          );

          if (targetStr) {
            const medusaRes = await searchLocales(
              vscode.workspace
                .getConfiguration("medusa")
                .get("appName") as string,
              "value",
              targetStr.text
            );
            return [
              {
                title: "新建一个 key",
                command: "vscodeMedusaLinter.createKey",
                arguments: [
                  {
                    url: `http://mcms-portal.alibaba-inc.com/v3/applicationList/${vscode.workspace
                      .getConfiguration("medusa")
                      .get(
                        "appName"
                      )}/modify?appName=${vscode.workspace
                      .getConfiguration("medusa")
                      .get("appName")}`
                  }
                ] as any
              }
            ].concat(
              medusaRes.map(eachInfo => ({
                title: `替换为 ${eachInfo.resourceKey} - ${
                  eachInfo.resourceValue
                }`,
                command: "vscodeMedusaLinter.replaceChineseToKey",
                arguments: [
                  { range: targetStr.range, newValue: eachInfo.resourceKey }
                ]
              }))
            );
          }
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscodeMedusaLinter.createKey", args => {
      open(args.url);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscodeMedusaLinter.replaceChineseToKey",
      args => {
        const edit = new vscode.WorkspaceEdit();

        if (args.newValue.indexOf(".") === -1) {
          return;
        }

        if (!edit || !vscode.window.activeTextEditor) {
          return;
        }

        const newValueSplit = args.newValue.split(".");
        newValueSplit.shift();

        const leftOneCode = vscode.window.activeTextEditor.document.getText(
          args.range.with({
            start: args.range.start.translate(0, -1),
            end: args.range.start
          })
        );

        const newValue =
          vscode.workspace
            .getConfiguration("medusa")
            .get("autocompletePrefix") + newValueSplit.join(".");

        if (leftOneCode === "'" || leftOneCode === '"' || leftOneCode === "`") {
          const leftTwoCode = vscode.window.activeTextEditor.document.getText(
            args.range.with({
              start: args.range.start.translate(0, -2),
              end: args.range.start.translate(0, -1)
            })
          );

          if (leftTwoCode === "=") {
            vscode.window.activeTextEditor.edit(builder => {
              builder.replace(
                args.range.with({
                  start: args.range.start.translate(0, -1),
                  end: args.range.end.translate(0, 1)
                }),
                newValue
              );
            });
          } else {
            vscode.window.activeTextEditor.edit(builder => {
              builder.replace(
                args.range.with({
                  start: args.range.start.translate(0, -1),
                  end: args.range.end.translate(0, 1)
                }),
                newValue
              );
            });
          }
        } else {
          vscode.window.activeTextEditor.edit(builder => {
            builder.replace(args.range, newValue);
          });
        }
      }
    )
  );
}

// this method is called when your extension is deactivated
export function deactivate() {}
