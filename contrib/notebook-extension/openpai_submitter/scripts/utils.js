define(function () {
  return {
    set_timeout: function timeout (ms, value) {
      return new Promise((resolve, reject) => {
        setTimeout(resolve, ms, value)
      })
    },
    set_timeout_func: function timeoutFunc (ms, func, args) {
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          func.apply(args)
          resolve()
        }, ms)
      })
    }
  }
})
