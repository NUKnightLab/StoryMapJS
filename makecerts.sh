# Adapted from:
# https://gist.github.com/cecilemuller/9492b848eb8fe46d462abeb26656c4f8

CERTDIR=.localstack
CA=KnightLabRootCA
FN=server.test.pem
STATE=Illinois
CITY=Evanston
COUNTRY=US
ORG=KnightLab
COMMON_NAME=localhost.storymap

mkdir -p .localstack

if [[ -f $CERTDIR/$FN
      || -f $CERTDIR/$FN.crt
      || -f $CERTDIR/$FN.key
      || -f $CERTDIR/$CA.crt
      || -f $CERTDIR/$CA.key
      || -f $CERTDIR/$CA.pem
      || -f $CERTDIR/$CA.srl
]]; then
    echo "Please delete existing cert files to run this script.\n\nTo delete, execute: rm $CERTDIR/$FN*; rm $CERTDIR/$CA.*"
    exit 1
fi

# Generate CA


openssl req \
    -x509 \
    -nodes \
    -new \
    -sha256 \
    -days 1024 \
    -newkey rsa:2048 \
    -keyout $CERTDIR/$CA.key \
    -out $CERTDIR/$CA.pem \
    -subj "/C=$COUNTRY/CN=$CA"

openssl x509 -outform pem -in $CERTDIR/$CA.pem -out $CERTDIR/$CA.crt

# Generate domain name cert


openssl req \
    -new \
    -nodes \
    -newkey rsa:2048 \
    -keyout $CERTDIR/$FN.key \
    -out $CERTDIR/$FN.csr \
    -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORG/CN=$COMMON_NAME"

openssl x509 \
    -req \
    -sha256 \
    -days 1024 \
    -in $CERTDIR/$FN.csr \
    -CA $CERTDIR/$CA.pem \
    -CAkey $CERTDIR/$CA.key \
    -CAcreateserial \
    -extfile localhost/domains.ext \
    -out $CERTDIR/$FN.crt

cat $CERTDIR/$FN.key $CERTDIR/$FN.crt > $CERTDIR/$FN

echo "Trust cert. E.g.: Apple Keychain > System. File > Import items: $CERTDIR/$FN\n\nSet to trust SSL."
echo "\nFor Firefox: Preferences > Certificates > View Certificates > Your Certificates > Import $CERTDIR/$CA.pem."
