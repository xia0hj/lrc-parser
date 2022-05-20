



/**
 * 
 * @param {string} lrc_text lrc 格式的歌词字符串
 * @param {function} callback_each_line
 */
export default function LycParser(lrc_text, callback_each_line) {
  this.lrc_text = lrc_text
  this.callback_each_line = callback_each_line
  this.tags = {
    ti: '', // title 歌曲标题
    ar: '', // artist 歌曲作者
    al: '', // album 歌曲所属专辑
    offset: 0, // 歌词偏移时间
    by: '' // 歌词编辑者
  }
  this.lines = []

  this._parse_ID_tags()
  this._parse_time_tags()
}


/**
 * 从 lrc 中解析 ti、ar、al、offset、by 标签，保存至 this.tags
 */
LycParser.prototype._parse_ID_tags = function () {
  for (let tag in this.tags) {
    // 正则表达式 /\[al:([^\]]*)]/i 可匹配 [al:xxx]，[ 和 ] 需要加斜杠转义，参数 i 表示不区分大小写字母
    const match_tag = this.lrc_text.match(new RegExp(`\\[${tag}:([^\\]]*)]`, 'i'))
    if (match_tag) {
      // 解析 [al:xxx]，则 match_tag[1]='xxx'
      this.tags[tag] = match_tag[1]
    }
  }
}

/**
 * 从 lrc 中解析时间标签，保存至 this.lines
 */
LycParser.prototype._parse_time_tags = function () {
  const time_reg_exp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g // 用于匹配 [03:33.90] 时间标签
  const lines = this.lrc_text.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const match_result = time_reg_exp.exec(line)
    if (match_result) {
      // 提取歌词文本
      const text = line.replace(time_reg_exp, '').trim()
      if (text) {
        this.lines.push({
          time: match_result[1] * 60 * 1000 + match_result[2] * 1000 + (match_result[3] || 0) * 10 + this.tags.offset,
          text
        })
      }
    }
  }

  // 每行歌词根据时间排序
  this.lines.sort((a, b) => a.time - b.time)
}


