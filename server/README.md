## Use SSL for request protection

### 1. Generate server cert

keytool -genkeypair -alias server -keyalg RSA -keysize 2048 -storetype PKCS12 -keystore server.p12 -validity 3650 -keypass charserverpwd -storepass charserverpwd -dname "C=CN,ST=BJ,L=BJ,O=JWTEC,OU=Server,CN=www.jwtec.com"
