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
const fs = require("fs");
const fsPath = require('path');
const vscode = require("vscode");
const FamConstants_1 = require("../constants/FamConstants");
const rimraf = require("rimraf");
/**
 * 文件处理工具类
 */
class FamFileUtils {
    /// 判断文件是否存在
    static exists(path) {
        return new Promise((resolve, _reject) => {
            fs.exists(path, (exists) => {
                resolve(exists);
            });
        });
    }
    /// 获取项目根目录
    static getRootPath() {
        let folders = vscode.workspace.workspaceFolders;
        if (folders) {
            let root = folders[0].uri.fsPath;
            return root;
        }
        return undefined;
    }
    /// 根据fam的配置，获取所有配置中的文件夹内的图片列表
    static getImageFileListByAssetsConfig(famAssetsConfig) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let assetsList = [];
            try {
                var workplaceRootPath = this.getRootPath();
                if (Array.isArray(famAssetsConfig) && famAssetsConfig.length > 0) {
                    for (var assetIndex in famAssetsConfig) {
                        var dirIsExists = yield this.exists(fsPath.join(workplaceRootPath, famAssetsConfig[assetIndex]));
                        /// 是否存在此文件夹
                        if (dirIsExists) {
                            var dirContent = yield this.readDirGetImageFile(workplaceRootPath, famAssetsConfig[assetIndex]);
                            /// 合并该列表
                            assetsList = assetsList.concat(dirContent);
                        }
                    }
                }
            }
            catch (e) {
                reject(e);
            }
            /// 返回结果
            resolve(assetsList);
        }));
    }
    ;
    /**
     * 读取文件夹内的所有支持的文件列表
     */
    static readDirGetImageFile(workplaceRootPath, path) {
        return new Promise((resolve, reject) => {
            try {
                let files = this.statSupportFile(workplaceRootPath, path);
                resolve(this.specilFormatFilter(files));
            }
            catch (e) {
                reject(e);
            }
        });
    }
    /**
     * 递归寻找子文件夹内的文件，并返回支持的文件类型的文件列表
     */
    static statSupportFile(workplaceRootPath, path) {
        var fileList = fs.readdirSync(fsPath.join(workplaceRootPath, path));
        var files = [];
        fileList.forEach(file => {
            let fPath = fsPath.join(path, file);
            let stat = fs.statSync(fsPath.join(workplaceRootPath, fPath));
            if (stat.isDirectory() === true) {
                files = files.concat(this.statSupportFile(workplaceRootPath, fPath));
            }
            else if (stat.isFile() === true && this.checkFileIsImageType(fPath)) {
                files.push(fPath);
            }
        });
        return files;
    }
    /**
     * 检查文件是否符合支持的文件类型
     */
    static checkFileIsImageType(path) {
        return FamConstants_1.SUPPORT_IMAGE_FILE_TYPES.indexOf('.' + this.getFileSuffix(path)) > -1;
    }
    /**
     * 获取文件后缀
     */
    static getFileSuffix(path) {
        let folders = path.split('/');
        if (folders.length > 0) {
            let fileName = folders[folders.length - 1];
            let fileNameStructure = fileName.split('.');
            if (fileNameStructure.length > 0) {
                return fileNameStructure[fileNameStructure.length - 1];
            }
            else {
                return undefined;
            }
        }
        else {
            return undefined;
        }
    }
    /// 过滤掉特殊的文件夹
    static specilFormatFilter(pathList) {
        const fliterPathList = pathList.map(path => {
            if (path.indexOf('/2.0x') > -1) {
                return path.replace(/\/2.0x/g, '');
            }
            else if (path.indexOf('/3.0x') > -1) {
                return path.replace(/\/3.0x/g, '');
            }
            else {
                return path;
            }
        });
        /// 去重后返回
        return Array.from(new Set(fliterPathList));
    }
    /**
     * 写文件
     */
    static writefile(path, content) {
        return new Promise((resolve, reject) => {
            fs.writeFile(path, content, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * 获取没有被引用的资源文件
     */
    static getNoUseAssetFiles(assetsList) {
        var workplaceRootPath = this.getRootPath();
        var codePath = '/lib';
        this.assetsFilterList = assetsList;
        this.statCodeFiles(workplaceRootPath, codePath);
        var assetsResult = this.assetsFilterList;
        this.assetsFilterList = null;
        return assetsResult;
    }
    /**
     * 递归处理子文件夹内的文件
     * 只处理dart文件
     * 判断文件内容是否含有assets路径
     */
    static statCodeFiles(workplaceRootPath, path) {
        var fileList = fs.readdirSync(fsPath.join(workplaceRootPath, path));
        fileList.forEach(file => {
            let fPath = fsPath.join(path, file);
            let stat = fs.statSync(fsPath.join(workplaceRootPath, fPath));
            if (stat.isDirectory() === true) {
                this.statCodeFiles(workplaceRootPath, fPath);
            }
            else if (stat.isFile() === true && this.getFileSuffix(fsPath.join(workplaceRootPath, fPath)) === 'dart') {
                /// dart文件
                let fileContent = fs.readFileSync(fsPath.join(workplaceRootPath, fPath), 'utf8');
                // fileContent = fileContent.replace(/\/\*(\s|.)*?\*\//g, '');// 文件内容删除/**/注释
                // fileContent = fileContent.replace(/\/\/[\s\S]*?\n/g, '');// 文件内容删除//注释
                /// 当文件内容含有assets的路径时，删除assetsFilterList列表的项目
                this.assetsFilterList = this.assetsFilterList.filter((assets) => {
                    return fileContent.indexOf(assets) === -1;
                });
            }
        });
    }
    /**
     * 删除文件或者文件夹
     */
    static rmrf(path) {
        return new Promise((resolve, reject) => {
            rimraf(path, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
    }
    /**
     * 删除参数中路径列表内的所有文件
     */
    static deleteFileByAssetsList(pathList) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                var workplaceRootPath = this.getRootPath();
                for (var i = 0; i < pathList.length; i++) {
                    let pathStructureArr = pathList[i].split('/');
                    let fileName = pathStructureArr[pathStructureArr.length - 1];
                    pathStructureArr.splice(pathStructureArr.length - 1, 1);
                    let filePathList = pathStructureArr;
                    /// 删除2.0x的文件
                    yield this.deleteAssetsFile(fsPath.join(workplaceRootPath, filePathList.join('/') + '/2.0x/'), fileName);
                    /// 删除3.0x的文件
                    yield this.deleteAssetsFile(fsPath.join(workplaceRootPath, filePathList.join('/') + '/3.0x/'), fileName);
                    /// 删除源目录的文件
                    yield this.deleteAssetsFile(fsPath.join(workplaceRootPath, filePathList.join('/') + '/'), fileName);
                }
            }
            catch (e) {
                reject(e);
            }
            resolve();
        }));
    }
    /**
     * 删除资源文件，如果删除后，该文件夹为空，也一并把文件夹删除
     */
    static deleteAssetsFile(path, fileName) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                let fileExists = yield this.exists(fsPath.join(path, fileName));
                fileExists && (yield this.rmrf(fsPath.join((path + fileName))));
                fileExists = yield this.exists(path);
                fileExists && this.folderIsEmpty(path) && (yield this.rmrf(path));
            }
            catch (e) {
                reject(e);
            }
            resolve();
        }));
    }
    /**
     * 判断文件夹是否空
     */
    static folderIsEmpty(path) {
        let fileList = fs.readdirSync(path);
        if (fileList.length === 1 && fileList[0] === '.DS_Store') {
            return true;
        }
        return fileList.length === 0;
    }
}
exports.default = FamFileUtils;
//# sourceMappingURL=FamFileUtils.js.map