threshold="$1"
time="$2"
df / | gawk \
'BEGIN {threshold=int("'"$threshold"'"); time=int("'"$time"'"); fb=0; chunk=0}
 END {
   if (chunk > 0) {
     for (var=0; var<time; var++){
       print "Generate "chunk"M data"
       system("fallocate -l "chunk"M fake"var);
       system("sleep 1");
     }
     print "All data generated."
   } else {
     print "Disk usage already above threshold!"
   }
 }
 match($6, /\//, a) {
   if (threshold <= 0 || threshold >= 100) threshold = 94;
   if (time <= 0) time = 1;
   chunk = $2 / 1024 / 100;
   fb = int(chunk * (threshold + 1) - $3 / 1024);
   if (fb < 0) fb = 0;
   max = int($4 / 1024 - chunk);
   if (fb > max) fb = max;
   chunk = int(fb / time)
 }
'
while true
do
  echo "Waiting cleaner to kill job..."
  sleep 5
done