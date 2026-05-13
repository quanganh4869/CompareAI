# Testing Guide

## Test Environment Setup

### 1. Install Dependencies
```bash
pip install pytest pytest-asyncio httpx
```

### 2. Environment Configuration
1. Create `.env` file in `tests/` directory
2. Add the following environment variables:
```env
POSTGRES_SERVER_UNIT_TEST='localhost'
POSTGRES_USER_UNIT_TEST='postgres'
POSTGRES_PASSWORD_UNIT_TEST='123456'
POSTGRES_PORT_UNIT_TEST=5432
```

## Running Tests

### 1. Run All Tests
```bash
# From project root directory
PYTHONPATH=$PYTHONPATH:$(pwd) pytest tests -v -s
```

### 2. Run Specific Test File
```bash
# Run a specific test file
PYTHONPATH=$PYTHONPATH:$(pwd) pytest tests/api/test_tenant_api.py -v -s
PYTHONPATH=$PYTHONPATH:$(pwd) pytest tests/api/test_clinic_slug_check_api.py -v -s
```

### 3. Run Specific Test Class or Function
```bash
# Run a specific test class
PYTHONPATH=$PYTHONPATH:$(pwd) pytest tests/functions/test_hmac.py::TestHmac -v -s

# Run a specific test function
PYTHONPATH=$PYTHONPATH:$(pwd) pytest tests/functions/test_hmac.py::TestHmac::test_generate_hmac_signature -v -s
```

-s: show log
