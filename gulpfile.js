var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;
var autoprefixer = require('gulp-autoprefixer');
var notify = require('gulp-notify');
var size = require('gulp-size');
var minicss = require('gulp-clean-css');//压缩css
var postcss = require('gulp-postcss');
var px2rem = require('postcss-px2rem');//将px转化成rem
var plumber = require('gulp-plumber');//防止报错使watch停止
var concat = require('gulp-concat');//合并文件
var uglify = require('gulp-uglify');//压缩js
var changed = require('gulp-changed');
var zip = require('gulp-zip');//将静态文件打包
var cache = require('gulp-cache');//智压缩改变的img图片
var imagemin = require('gulp-imagemin');//压缩图片
var pngquant = require('imagemin-pngquant');
var del = require('del');//删除文件或文件夹
var revOrig = require('gulp-rev-orig');//添加版本号

//HTML处理
gulp.task('html',function(){
  return gulp.src('src/*.html')
  .pipe(revOrig({
    revType: 'hash',
    hashLength: 12
  }))
  .pipe(gulp.dest('dist'))
})

// 图片处理
gulp.task('img',function(){
  return gulp.src('src/img/**/*')
  .pipe(cache(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
  })))
  .pipe(gulp.dest('dist/img'))
})

//编译sass
gulp.task('sass',function() {
    var onError = function(err) {
        notify.onError({
            title: "Gulp",
            subtitle: "失败!",
            message: "错误: <%= error.message %>",
            sound: "Beep"
        })(err);
        this.emit('end');
    };
    var processors = [px2rem({
        remUnit: 75
    })];
    var s = size();
    return gulp.src('src/sass/*.scss')
        .pipe(plumber({
            errorHandler: onError
        }))
        .pipe(changed('src/sass',{extension:'.sass'}))
        .pipe(sass())
        .pipe(autoprefixer({
            browsers: ["Android 2.3", "iOS 7"]
        }))
        .pipe(postcss(processors))
        .pipe(concat('style.css'))
        .pipe(s)//计算最后文件的大小
        .pipe(minicss())
        .pipe(gulp.dest('src/css'))
        .pipe(gulp.dest('dist/css'))
        .pipe(notify({
            onLast: true,
            message: () => `Css总大小: ${s.prettySize}`
        }))
})

// js处理
gulp.task('js',function(){
  var onError = function(err) {
      notify.onError({
          title: "Gulp",
          subtitle: "失败!",
          message: "错误: <%= error.message %>",
          sound: "Beep"
      })(err);
      this.emit('end');
  };
  var s = size();
  return gulp.src('src/javascript/*.js')
  .pipe(plumber({
      errorHandler: onError
  }))
  .pipe(concat('all.js'))
  .pipe(uglify())
  .pipe(s)
  .pipe(gulp.dest('src/js'))
  .pipe(gulp.dest('dist/js'))
  .pipe(notify({
      onLast: true,
      message: () => `JS 总大小: ${s.prettySize}`
  }))
})

//对公共库的处理如zepto等
gulp.task('public-js',function(){
  return gulp.src('src/javascript/public/*.js')
  .pipe(uglify())
  .pipe(gulp.dest('dist/js/public'))
})

//监测变化
gulp.task('watch', function() {
        gulp.watch('src/sass/*.scss',function(){
          gulp.run('sass')
          gulp.run('html')
        })
        gulp.watch('src/*.html', ['html'])
        gulp.watch('src/img/**/*', ['img'])
        gulp.watch('src/javascript/*.js',function(){
          gulp.run('js')
          gulp.run('html')
        })
        gulp.watch('src/javascript/public/**.*',['public-js'])
    })

//打包静态文件
gulp.task('zip',function(){
  return gulp.src('dist/*')
  .pipe(zip('dist.zip'))
  .pipe(gulp.dest('./'))
})

// 浏览器刷新
gulp.task('browser-sync', function() {
    browserSync.init(['dist/*.html','dist/css/*.css','dist/js/*.js','dist/img/**/*'], {
        server: {
            baseDir: "dist",
            //端口访问显示文件列表
            directory: true
        },
        //自定义端口
        port: 3000,
        //不显示在浏览器中的任何通知
        notify: true,
        //视口同步到顶部位置
        scrollProportionally: false
    })
})


//清除css文件夹
gulp.task('del-css', function() {
    del('dist/css')
})
// 清除js文件夹
gulp.task('del-js', function() {
    del('dist/js')
})
//清除html
gulp.task('del-html', function() {
    del('dist/*.html')
})
//清除img
gulp.task('del-img', function() {
    del('dist/img')
})
// 清除掉因添加版本号生成的文件夹
gulp.task('clean',function(){
  del(['src/css','src/js'])
})

gulp.task('default', ['js','public-js','sass','html','watch','img','browser-sync'])
gulp.task('del',['del-html','del-css','del-js','del-img'])
