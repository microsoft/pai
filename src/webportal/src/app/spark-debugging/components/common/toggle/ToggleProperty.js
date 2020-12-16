

export default class TableProperty {
    /**
     * The constructor function of toggleProperty
     * @param {*} handleClickisShowTable fun type
     * @param {*} title * type
     * @param {*} isShow bool type
     */
      constructor(handleClickisShowTable, title, isShow) {
        this.handleClickisShowTable = handleClickisShowTable;
        this.title = title;
        this.isShow = isShow;
    }
}