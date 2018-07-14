# Real-time animated particle visualization of network flows

## To install

1. Copy files to the sFlow-RT app directory.
2. Restart sFlow-RT to load application.

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
