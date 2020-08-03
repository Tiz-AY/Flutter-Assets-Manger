"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAllCommands = void 0;
const vscode = require("vscode");
const FamCommandName_1 = require("./constants/FamCommandName");
const fs = require("fs");
const path = require('path');
const YAML = require("yaml");
const FamFileUtils_1 = require("./utils/FamFileUtils");
const DateUtils_1 = require("./utils/DateUtils");
function registerAllCommands(context) {
    context.subscriptions.concat([
        /**
         * 注册更新Assets命令
         * 命名已设置只对pubspec.yaml文件可见
         */
        vscode.commands.registerCommand(FamCommandName_1.default.REFRESH_ASSETS, () => __awaiter(this, void 0, void 0, function* () {
            /// 获取当前的文件路径
            const uri = vscode.window.activeTextEditor.document.uri;
            /// 读取yaml文件内容
            const yamlFileContent = fs.readFileSync(uri.path, 'utf8');
            /// yaml内容转换成js对象
            const yamlObj = YAML.parse(yamlFileContent);
            /// 读取yaml里面的fam配置
            /// example:
            /// fam:
            /// assets:
            /// - assets/images
            /// - assets/es
            /// 兼容判断
            if (!yamlObj.hasOwnProperty('fam')) {
                vscode.window.showInformationMessage('Fam configured failed');
                return false;
            }
            if (!yamlObj['fam'].hasOwnProperty('assets')) {
                return false;
            }
            /// 更新['flutter']['assets']的内容
            yamlObj['flutter']['assets'] = yield FamFileUtils_1.default.getImageFileListByAssetsConfig(yamlObj['fam']['assets']);
            /// 重新写入到pubspec.yaml文件中
            yield FamFileUtils_1.default.writefile(uri.path, YAML.stringify(yamlObj));
            /// 信息提示
            vscode.window.showInformationMessage('Fam Refresh Assets Success');
        })),
        /**
         * 注册查找没用assets命令
         * 命名已设置只对pubspec.yaml文件可见
         */
        vscode.commands.registerCommand(FamCommandName_1.default.Delete_UNUSED_ASSETS, () => __awaiter(this, void 0, void 0, function* () {
            /// 获取当前的文件路径
            const uri = vscode.window.activeTextEditor.document.uri;
            /// 读取yaml文件内容
            const yamlFileContent = fs.readFileSync(uri.path, 'utf8');
            /// yaml内容转换成js对象
            const yamlObj = YAML.parse(yamlFileContent);
            /// 读取yaml里面的fam配置
            /// example:
            /// fam:
            /// assets:
            /// - assets/images
            /// - assets/es
            /// 兼容判断
            if (!yamlObj.hasOwnProperty('fam')) {
                vscode.window.showInformationMessage('Fam configured failed');
                return false;
            }
            if (!yamlObj['fam'].hasOwnProperty('assets')) {
                return false;
            }
            /// 读取所有的图片资源列表
            var assetsList = yield FamFileUtils_1.default.getImageFileListByAssetsConfig(yamlObj['fam']['assets']);
            /// 从libs里面查找没有被引用的图片资源列表
            var assetsNoUseList = FamFileUtils_1.default.getNoUseAssetFiles(assetsList);
            /// dialog信息窗提示用户
            /// 按钮详细：
            /// Delete：立即删除没有被应用的图片资源
            /// Generate Log File:在root目录中生成并把没有被应用的图片资源写入fam-delete-file.log文件
            var informationMessageResponse = yield vscode.window.showInformationMessage(`Fam Found ${assetsNoUseList.length} unused resources`, {
                modal: true
            }, { title: "Delete" }, { title: "Generate Log File" });
            /// 当有点击事件时的处理
            if (informationMessageResponse) {
                if (informationMessageResponse.title === 'Generate Log File') {
                    /// 当用户点击了 Generate Log File
                    /// .log文件内容
                    var fileContent = `Fam Found ${assetsNoUseList.length} unused resources:
${assetsNoUseList.join("\n")}

create by Fam ${DateUtils_1.dateFormatTime(new Date(), 'yyyy-MM-dd hh:mm:ss')}`;
                    /// 获取项目根目录
                    var workplaceRootPath = FamFileUtils_1.default.getRootPath();
                    /// 写入fam-delete-file.log文件
                    yield FamFileUtils_1.default.writefile(path.join(workplaceRootPath, 'fam-delete-file.log'), fileContent);
                    /// 信息提示
                    vscode.window.showInformationMessage('Generate Log File Success');
                }
                else if (informationMessageResponse.title === 'Delete') {
                    /// 当用户点击了 Delete
                    try {
                        /// 删除没有被应用的图片
                        yield FamFileUtils_1.default.deleteFileByAssetsList(assetsNoUseList);
                    }
                    catch (e) { }
                    /// 更新['flutter']['assets']的内容
                    yamlObj['flutter']['assets'] = yield FamFileUtils_1.default.getImageFileListByAssetsConfig(yamlObj['fam']['assets']);
                    /// 重新写入到pubspec.yaml文件中
                    yield FamFileUtils_1.default.writefile(uri.path, YAML.stringify(yamlObj));
                    /// 信息提示
                    vscode.window.showInformationMessage('Delete Unused Assets Success');
                }
            }
        }))
    ]);
}
exports.registerAllCommands = registerAllCommands;
//# sourceMappingURL=commands.js.map