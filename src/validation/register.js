const validator = require('validator');
const isEmpty = require('./is-empty');

const validateRegisterInput = data => {
    const errors = {
        password: false,
        device: false,
        pin: false,
        secretFileLabel: false,
        numShards: false
    };
    let isValid = true;

    // Check if value is empty (also if not exist) if not set empty string
    // Check only for required fields
    data.password = !isEmpty(data.password) ? data.password : '';
    data.numShards = !isEmpty(data.numShards) ? data.numShards : '';

    if (!isEmpty(data.device)) {
        if (!validator.isIP(data.device)) {
            errors.device = 'Device ip is not correct';
            isValid = false;
        }

        if (isEmpty(data.pin)) {
            errors.pin = 'If you are using device method pin field is required';
            isValid = false;
        }
    } else if (validator.equals(data.secretFileLabel, 'Choose your secret file')) {
        errors.device = 'One between device and secret file is required';
        errors.secretFileLabel = 'One between device and secret file is required';
        isValid = false;
    }

    if (!isEmpty(data.pin)) {
        if (!validator.isLength(data.pin, { min: 6, max: 6 })) {
            errors.pin = 'Pin should be 6 numeric characters';
            isValid = false;
        }

        if (!validator.isNumeric(data.pin)) {
            errors.pin = 'Pin should contains only numeric characters';
            isValid = false;
        }
    }

    if (!validator.isLength(data.password, { min: 8 })) {
        errors.password = 'Password should be at least 8 characters';
        isValid = false;
    }

    if (validator.isEmpty(data.password)) {
        errors.password = 'Password field is required';
        isValid = false;
    }

    if (validator.isEmpty(data.numShards)) {
        errors.numShards = 'Number of shards field is required';
        isValid = false;
    }

    return {
        errors,
        isValid
    };
};

const isValidIp = value => {
    return validator.isIP(value);
};

module.exports = {
    validateRegisterInput,
    isValidIp
};
