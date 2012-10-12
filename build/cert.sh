DIR="$( cd -P "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CERT_DIR="$DIR/../cert" # Change this to store certs somewhere else
SSL_DIR="$CERT_DIR/ssl"
PASS_KEY="server.key.secure"
PASSLESS_KEY="server.key"
CSR="server.csr"
CA_KEY="cakey.pem"
CA_CERT="cacert.pem"

confirm() {
  read -p "$1 [Y/n] " -n 1;
  echo
  [[ $REPLY =~ ^[Yy]$ ]];
}

generateServerKeys() {
  confirm "Generate key for the CSR (should have a password)" \
    && openssl genrsa -des3 -out $CERT_DIR/server.key 2048

  confirm "Generate insecure key (no password)" \
    && openssl rsa -in $CERT_DIR/server.key -out $CERT_DIR/server.key.insecure

  confirm "Swap the names (Yes you want to)" \
    && mv $CERT_DIR/server.key $CERT_DIR/$PASS_KEY \
    && mv $CERT_DIR/server.key.insecure $CERT_DIR/$PASSLESS_KEY

  confirm "Generate CSR with insecure key" \
    && echo "You have to remember these settings as they need to match." \
    && echo "Common Name should be set the to hostname of the server" \
    && openssl req -new -key $CERT_DIR/$PASSLESS_KEY -out $CERT_DIR/$CSR
}

replace() {
  local key=$1
  local postfix=$2
  local replace=$3
  local file=$4
  sudo sed -i -e "s/^\($key\s*=\ş*\).*\(\s*$postfix\)/\1 $replace \2/" $file
}

configureCA() {
  local file="/etc/ssl/openssl.cnf"
  sudo cp $file{,.temp}
  replace "dir" "# Where everything is kept" "\/etc\/ssl\/" "$file.temp"
  replace "database" "# database index file\." "\$dir\/CA\/index.txt" "$file.temp"
  replace "certificate" "# The CA certificate" "\$dir\/certs\/$CA_CERT" "$file.temp"
  replace "serial" "# The current serial number" "\$dir\/CA\/serial" "$file.temp"
  replace "private_key" "# The private key" "\$dir\/private\/$CA_KEY" "$file.temp"
  diff $file{.temp,}
  confirm "Do you agree to these changes?" \
    && sudo mv $file{.temp,}
}

generateCA() {
  confirm "Setup CA database file etc" && {
      mkdir -p $SSL_DIR{,/CA,/newcerts,/private,/certs}
      echo "01" > $SSL_DIR/CA/serial
      touch $SSL_DIR/CA/index.txt
    }

  confirm "Generate a root certificate" \
    && echo "Remember those settings? Enter them here" \
    && echo "Common Name should be set the to hostname of the server" \
    && openssl req -new -x509 -extensions v3_ca \
      -keyout $SSL_DIR/private/$CA_KEY -out $SSL_DIR/certs/$CA_CERT -days 3650

  confirm "Move everything into its place" \
    && sudo cp {$SSL_DIR,/etc/ssl}/private/$CA_KEY \
    && sudo cp {$SSL_DIR,/etc/ssl}/certs/$CA_CERT \
    && sudo mkdir -p /etc/ssl/{CA,newcerts} \
    && sudo cp {$SSL_DIR,/etc/ssl}/CA/serial \
    && sudo cp {$SSL_DIR,/etc/ssl}/CA/index.txt

  confirm "Do you have to configure the openssl config?" \
    && configureCA

}

configureCert() {
  confirm "Sign CSR" \
    && sudo openssl ca -in $CERT_DIR/$CSR -config /etc/ssl/openssl.cnf

  ls /etc/ssl/newcerts
  echo -n "Which certificate file do you want to use?"
  read newcert

  echo -n "What host will be used? "
  read host

  sudo sh -c "cat /etc/ssl/newcerts/$newcert \
    | sed -n '/^-----BEGIN CERTIFICATE/,/^-----END CERTIFICATE/p' \
    > /etc/ssl/newcerts/$host.crt"
}

generateKeyStore() {
  local pass="server"
  confirm "Generate Java Key Store" \
    && cp $SSL_DIR/certs/cacert.{pem,cer} \
    && { echo -n "What password? "; read pass; } \
    && keytool -importcert -v -trustcacerts \
      -file $SSL_DIR/certs/cacert.cer \
      -alias IntermediateCA \
      -keystore $CERT_DIR/mykeystore.bks \
      -provider org.bouncycastle.jce.provider.BouncyCastleProvider \
      -providerpath $DIR/bcprov-jdk16-145.jar \
      -storetype BKS \
      -storepass "$pass"

  keytool -list -keystore "$CERT_DIR/mykeystore.bks" \
    -provider org.bouncycastle.jce.provider.BouncyCastleProvider \
    -providerpath "$DIR/bcprov-jdk16-145.jar" \
    -storetype BKS \
    -storepass "$pass"
}

generateMongoDBKeys() {
  confirm "Generate keys for MongoDB" \
    && mkdir -p $CERT_DIR/mongodb \
    && openssl req -new -x509 -days 365 -nodes -out $CERT_DIR/mongodb/mongodb-cert.pem -keyout $CERT_DIR/mongodb/mongodb-cert.key

  confirm "Combine the MongoDB key and the certificate into one file" \
    && cat $CERT_DIR/mongodb/mongodb-cert.{key,pem} > $CERT_DIR/mongodb/mongodb.pem
}

init() {
  mkdir -p $CERT_DIR{,/private,/cert}
  generateServerKeys
  generateCA
  confirm "Do you want to configure the certificate" && configureCert
  generateKeyStore
  echo "Your files:

Server Certificate: ./cert/ssl/newcerts/YOUR-HOST.crt
Server Key: ./cert/server.key
CA Certificate: ./cert/ssl/certs/cacert.pem
Java Key Store: ./cert/mykeystore.bks
  "
  generateMongoDBKeys
}

init
