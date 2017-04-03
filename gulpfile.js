var typescript = require('gulp-tsc');
 
gulp.task('compile', function(){
  gulp.src(['Scripts/*.ts'])
    .pipe(typescript())
    .pipe(gulp.dest('Scripts/'))
});