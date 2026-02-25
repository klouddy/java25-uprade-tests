FROM prom/prometheus:latest

ARG ALB_DNS

COPY prometheus.yml /etc/prometheus/prometheus.yml

RUN if [ -n "$ALB_DNS" ]; then \
      sed -i "s/__ALB_DNS__/${ALB_DNS}/g" /etc/prometheus/prometheus.yml; \
    fi
