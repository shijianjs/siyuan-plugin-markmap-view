```sh
docker pull b3log/siyuan:v3.5.4

docker pull swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/b3log/siyuan:v3.5.4
docker tag  swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/b3log/siyuan:v3.5.4  docker.io/b3log/siyuan:v3.5.4


docker run --rm -it \
  -p 6806:6806 \
  -v /home/shijianjs/workspace/siyuan/data1:/siyuan/workspace \
  b3log/siyuan:v3.5.4 \
  --workspace=/siyuan/workspace/ \
  --accessAuthCode=xxx

```
