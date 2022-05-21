// @ts-check

const STATE_PAUSE = 0
const STATE_PLAYING = 1

/**
 * @callback CallbackEachLine 回调函数类型定义
 * @param {{lineNum:number, txt:string}} curLine
 */

/**
 * @typedef {Object} Line
 * @property {number} time - 该行歌词对应时间，单位 ms
 * @property {string} text - 歌词文本
 */

/**
 * @class
 */
export default class LrcParser {

  /**
   * @constructor
   * @param {string} lrcData - lrc 格式的数据
   * @param {CallbackEachLine} callbackEachLine - 播放时每行歌词的回调函数
   */
  constructor(lrcData, callbackEachLine) {
    this.lrcData = lrcData
    this.callbackEachLine = callbackEachLine
    this.tags = {
      ti: '', // title 歌曲标题
      ar: '', // artist 歌曲作者
      al: '', // album 歌曲所属专辑
      offset: '', // 歌词偏移时间
      by: '' // 歌词编辑者
    }
    /** @type {Line[]} */
    this.lines = []
    this.state = STATE_PAUSE
    this.curIndex = 0 // 当前歌词在 this.lines 数组中的下标
    this.startTimeStamp = 0 // 歌曲开始时的时间戳，假如不是从 0 开始播放，要计算出歌曲本来的起始时间
    this.timer = null
    this.pauseTimeStamp = 0

    this._parseFlagTags()
    this._parseTimeTage()
  }


  // #region 初始化解析标签

  /**
   * @private
   */
  _parseFlagTags() {
    for (let tag in this.tags) {
      // 正则表达式 /\[al:([^\]]*)]/i 可匹配 [al:xxx]，[ 和 ] 需要加斜杠转义，参数 i 表示不区分大小写字母
      const matchTag = this.lrcData.match(new RegExp(`\\[${tag}:([^\\]]*)]`, 'i'))
      if (matchTag) {
        // 解析 [al:xxx]，则 matchTag[1]='xxx'
        this.tags[tag] = matchTag[1]
      }
    }
  }

  /**
   * @private
   */
  _parseTimeTage() {
    const timeTagRegExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g // 用于匹配 [03:33.90] 时间标签
    const lines = this.lrcData.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matchResult = timeTagRegExp.exec(line)
      if (matchResult) {
        // 提取歌词文本
        const text = line.replace(timeTagRegExp, '').trim()
        if (text) {
          const minToMs = Number.parseInt(matchResult[1]) * 60 * 1000
          const sToMs = Number.parseInt(matchResult[2]) * 1000
          const percentToMs = Number.parseInt(matchResult[3]) * 10 || 0 // 百分之一秒
          const offsetToMs = Number.parseInt(this.tags.offset) || 0
          this.lines.push({
            time: minToMs + sToMs + percentToMs + offsetToMs,
            text
          })
        }
      }
    }

    // 每行歌词根据时间排序
    this.lines.sort((a, b) => a.time - b.time)
  }

  // #endregion 初始化解析标签

  // #region public api

  /**
   * 开始播放歌词
   * @public
   * @param {number} startTime - 开始播放的时间位置，单位 ms
   */
  play(startTime = 0) {
    if (!this.lines.length) {
      return
    }
    this.state = STATE_PLAYING
    this.curIndex = this._findIndexByTime(startTime)
    this.startTimeStamp = new Date().getTime() - startTime

    if (this.curIndex >= 0 && this.curIndex < this.lines.length) {
      clearTimeout(this.timer)
      this._keepPlaying()
    }
  }

  /**
   * 终止播放
   * @public
   */
  stop() {
    this.state = STATE_PAUSE
    clearTimeout(this.timer)
  }

  /**
   * 切换播放状态
   * @public
   */
  toggleState() {
    if (this.state === STATE_PLAYING) {
      this.stop()
      this.pauseTimeStamp = new Date().getTime() // 记录暂停时间戳
    } else if (this.state === STATE_PAUSE) {
      this.state = STATE_PLAYING
      this.play(this.pauseTimeStamp - this.startTimeStamp)
    }
  }

  // #endregion public api

  // #region private api

  /**
   * 根据时间查找对应的歌词下标
   * @param {number} time - 时间，单位 ms
   * @returns {number} 歌词下标
   */
  _findIndexByTime(time) {
    for (let i = 0; i < this.lines.length; i++) {
      if (time <= this.lines[i].time) {
        return i
      }
    }
    return this.lines.length - 1
  }

  /**
   * 根据歌词下标执行对应的回调函数
   * @private
   * @param {number} index 下标
   */
  _invokeCallback(index) {
    if (index < 0 || index >= this.lines.length) {
      return
    }
    this.callbackEachLine({
      lineNum: index,
      txt: this.lines[index].text
    })
  }

  /**
   * 按照 this.curIndex 开始持续播放歌词
   * @private
   */
  _keepPlaying() {
    const curLine = this.lines[this.curIndex]
    const delay = curLine.time - (new Date().getTime() - this.startTimeStamp)
    this.timer = setTimeout(() => {
      this._invokeCallback(this.curIndex++)
      if (this.curIndex < this.lines.length && this.state === STATE_PLAYING) {
        this._keepPlaying()
      }
    }, delay)
  }

  // #endregion private api

}








