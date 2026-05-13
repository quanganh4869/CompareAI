import asyncio
import hashlib
import os
from typing import Optional

from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes


class AesGCMRotation:
    BATCH_SIZE = 50

    def __init__(self, configuration):
        self.configuration = configuration

    def encrypt_data(self, plaintext: str) -> str:
        """
        Encrypt data with AES GCM, return encrypted data(string)
        :param plaintext: str
        :return: str

        Example:
        >>> plaintext = "Hello, World!"
        >>> encrypted_data = encrypt_data(plaintext)
        >>> print(f"Encrypted data: {encrypted_data} {type(encrypted_data)}")
        """
        if not plaintext:
            return plaintext

        key = self.configuration.SECRET_ROTATION_KEY_MAPPING.get(
            self.configuration.SECRET_CURRENT_VERSION
        ).encode()
        nonce = os.urandom(12)
        cipher = Cipher(
            algorithms.AES(key), modes.GCM(nonce), backend=default_backend()
        )
        encryptor = cipher.encryptor()

        ciphertext = encryptor.update(plaintext.encode()) + encryptor.finalize()
        return f"{self.configuration.SECRET_CURRENT_VERSION.encode().hex()}:{nonce.hex()}:{ciphertext.hex()}:{encryptor.tag.hex()}"  # noqa: E501

    def decrypt_data(self, encrypted_data: str) -> str:
        """
        Decrypt data with AES GCM, return decrypted data(string)
        :param encrypted_data: str
        :return: str

        Example:
        >>> encrypted_data = "1311d1831c32d96924c68521:c44eed31def723a026cd387cae:1467fa3e1d8277837252676a0a97b082"
        >>> decrypted_data = decrypt_data(encrypted_data)
        >>> print(f"Decrypted data: {decrypted_data} {type(decrypted_data)}")
        """
        if not encrypted_data or ":" not in encrypted_data:
            return encrypted_data

        version, nonce, ciphertext, tag = (
            bytes.fromhex(x) for x in encrypted_data.split(":")
        )
        key = self.configuration.SECRET_ROTATION_KEY_MAPPING.get(
            version.decode()
        ).encode()
        cipher = Cipher(
            algorithms.AES(key),
            modes.GCM(nonce, tag),
            backend=default_backend(),
        )
        decryptor = cipher.decryptor()

        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        return plaintext.decode()

    def sha512_hash(self, plaintext: str) -> str | None:
        """
        Hash data with SHA512, return hash(string)
        :param plaintext: str
        :return: str (len 128) | None
        """
        if plaintext is not None:
            return hashlib.sha512(str(plaintext).encode()).hexdigest()
        return plaintext

    def sha256_hash(self, plaintext: str) -> str | None:
        """
        Hash data with SHA256, return hash(string)
        :param plaintext: str
        :return: str (len 64) | None
        """
        if plaintext is not None:
            return hashlib.sha256(str(plaintext).encode()).hexdigest()
        return plaintext

    async def encrypt_batch_datas(self, data: list[str]) -> list:
        """
        Encrypt batch data with AES GCM, encrypt many data(string) on list
        :param data: list[str]
        :return: list[str]

        Example:
        >>> data = ["Hello, World!", "Hello, World!", "Hello, World!"]
        >>> encrypted_datas = await encrypt_batch_datas(data)
        >>> print(f"Encrypted data: {encrypted_datas}")
        """
        result = []
        for i in range(0, len(data), self.BATCH_SIZE):
            batch_data = data[i : i + self.BATCH_SIZE]
            encrypted_data = await asyncio.gather(
                *[self.encrypt_data(d) for d in batch_data]
            )
            result.extend(encrypted_data)
        return result

    async def decrypt_batch_datas(self, data: list[str]) -> list:
        """
        Decrypt batch data with AES GCM, decrypt many data(string) on list
        :param data: list[str]
        :return: list[str]

        Example:
        >>> encrypted_datas = [
            "1311d1831c32d96924c68521:c44eed31def723a026cd387cae:1467fa3e1d8277837252676a0a97b082",
            "5223f4cbf19e94dfce889c10:d99c57bc75f5eefe8429a4cedb:7c97972a61e910b7acfe1e103d1f6683",
            "6ce7cd2737464e29fb901846:cc20ea4aad3294f4f83b0e5bb0:f6c45b764fa78698e1f08d9994a454c3"
        ]
        >>> decrypted_datas = await decrypt_batch_datas(encrypted_datas)
        >>> print(f"Decrypted data: {decrypted_datas}")
        """
        result = []
        for i in range(0, len(data), self.BATCH_SIZE):
            batch_data = data[i : i + self.BATCH_SIZE]
            decrypted_data = await asyncio.gather(
                *[self.decrypt_data(d) for d in batch_data]
            )
            result.extend(decrypted_data)
        return result

    async def encrypt_batch_fields(self, data: list[dict], fields: list[str]) -> list:
        """
        Encrypt batch fields with AES GCM, return list of dict with encrypted fields value
        :param data: list[dict]
        :param fields: list[str]
        :return: list

        Example:
        >>> data = [{"name": "John", "age": "30", 12: "abc"}, {"name": "Jane", "age": "25"}]
        >>> encrypted_datas = await encrypt_batch_fields(data, ["name", "age"])
        >>> print(f"Encrypted data: {encrypted_datas}")
        """
        result = []

        async def encrypt_field(d):  # noqa: ASYNC124
            return {
                **d,
                **{field: self.encrypt_data(d[field]) for field in fields},
            }

        for i in range(0, len(data), self.BATCH_SIZE):
            batch_data = data[i : i + self.BATCH_SIZE]
            encrypted_data = await asyncio.gather(
                *[encrypt_field(d) for d in batch_data]
            )
            result.extend(encrypted_data)
        return result

    async def decrypt_batch_fields(self, data: list[dict], fields: list[str]) -> list:
        """
        Decrypt batch fields with AES GCM, decrypt many fields on dict of list
        :param data: list[dict]
        :param fields: list[str]
        :return: list

        Example:
        >>> encrypted_datas = [
            {
                'name': '31c43a6c01fa6ef8a539b67f:e2eb05e4:3caec511b7c7e74923e6b73447c6a876',
                'age': 'c7114a63d0d764a535d306c0:f72c:2a72660e8420442c1b0cb1291d625acc',
                12: 'abc'
            },
            {
                'name': '42cd285d50cf90b16ee02851:6b824f1b:717d52bbde0c6a2e8c98c44dd3df358e',
                'age': 'c19b007d221545693eac1b2a:821f:da0cbf18c379532500d421cfb1de5439'
            }
        ]
        >>> decrypted_datas = await decrypt_batch_fields(encrypted_datas, ["name", "age"])
        >>> print(f"Decrypted data: {decrypted_datas}")
        """
        result = []

        async def decrypt_field(d):  # noqa: ASYNC124
            return {
                **d,
                **{field: self.decrypt_data(d[field]) for field in fields},
            }

        for i in range(0, len(data), self.BATCH_SIZE):
            batch_data = data[i : i + self.BATCH_SIZE]
            decrypted_data = await asyncio.gather(
                *[decrypt_field(d) for d in batch_data]
            )
            result.extend(decrypted_data)
        return result

    def encrypt_and_hash_selected_fields(
        self,
        data: dict,
        encrypt_fields: Optional[list[str]] = None,
        hash_fields: Optional[list[str]] = None,
    ) -> dict:
        """
        Encrypt fields in a single dict with AES GCM, return dict with encrypted and hash field values
        Hash fields are hashed with SHA256 and field name is appended with "_hash"
        :param data: dict
        :param encrypt_fields: list[str]
        :param hash_fields: list[str]
        :return: dict

        Example:
        >>> data = {"name": "John", "age": "30", "12": "abc"}
        >>> encrypted_data = encrypt_and_hash_selected_fields(data, ["name", "age"], ["name"])
        >>> print(f"Encrypted data: {encrypted_data}")
        """
        encrypted_and_hash_data = data.copy()

        if hash_fields:
            for field in hash_fields:
                if field in encrypted_and_hash_data:
                    value_field_hash = self.sha256_hash(encrypted_and_hash_data[field])
                    name_field_hash = f"{field}_hash"
                    encrypted_and_hash_data[name_field_hash] = value_field_hash

        if encrypt_fields:
            for field in encrypt_fields:
                if field in encrypted_and_hash_data:
                    encrypted_and_hash_data[field] = self.encrypt_data(
                        encrypted_and_hash_data[field]
                    )

        return encrypted_and_hash_data

    def decrypt_selected_fields(self, data: dict, fields: list[str]) -> dict:
        """
        Decrypt fields in a single dict with AES GCM, return dict with decrypted field values
        :param data: dict
        :param fields: list[str]
        :return: dict

        Example:
        >>> encrypted_data = {
            'name': '31c43a6c01fa6ef8a539b67f:e2eb05e4:3caec511b7c7e74923e6b73447c6a876',
            'age': 'c7114a63d0d764a535d306c0:f72c:2a72660e8420442c1b0cb1291d625acc',
            12: 'abc'
        }
        >>> decrypted_data = decrypt_selected_fields(encrypted_data, ["name", "age"])
        >>> print(f"Decrypted data: {decrypted_data}")
        """

        decrypted_data = data.copy()
        for field in fields:
            if field in decrypted_data:
                encrypted_value = decrypted_data[field]
                decrypted_data[field] = self.decrypt_data(encrypted_value)

        return decrypted_data
