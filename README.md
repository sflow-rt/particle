# Real-time animated particle visualization of network flows

https://blog.sflow.com/2018/07/visualizing-real-time-network-traffic.html

## To install

1. [Download sFlow-RT](https://sflow-rt.com/download.php)
2. Run command: `sflow-rt/get-app.sh sflow-rt particle`
3. Restart sFlow-RT

Alternatively, use the Docker image:
https://hub.docker.com/r/sflow/particle/

## Demo

Set property -Dparticle.demo=yes

## Configuration

Set the following properties label axes and assign addresses:

* particle.axisN=Internet
* particle.cidrN=0.0.0.0/0
* particle.axisS=Site
* particle.cidrS=10.1.1.0/24,10.1.2.0/24
* particle.axisE=Data Center
* particle.cidrE=10.2.0.0/16
* particle.asisW=Remote
* particle.cidrW=10.3.0.0/16

To enable DNS, Country and ASN lookups configure the following:

* dns.servers
* geo.country
* geo.asn

See https://sflow-rt.com/reference.php#properties

## UI

Hover over diagram to freeze animation, highlight nearest particle, and 
display particle details.

For more information, visit:
https://sFlow-RT.com
