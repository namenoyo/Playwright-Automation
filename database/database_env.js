const configdb = {
    letterreturn: {
        SIT: {
            DB_USER: 'letterreturn',
            DB_PASSWORD: 'nopass',
            DB_HOST: '11.100.8.42',
            DB_PORT: 5432,
            DB_NAME: 'letterreturn',
        },
        UAT: {
            DB_USER: 'letterreturn',
            DB_PASSWORD: 'nopass',
            DB_HOST: '11.100.8.42',
            DB_PORT: 5432,
            DB_NAME: 'letterreturn',
        }
    },
    splife: {
        SIT: {
            DB_USER: 'splife',
            DB_PASSWORD: 'nopass',
            DB_HOST: '10.14.8.44',
            DB_PORT: 5432,
            DB_NAME: 'splife',
        },
        UAT: {
            DB_USER: 'splife',
            DB_PASSWORD: 'nopass',
            DB_HOST: '10.14.8.44',
            DB_PORT: 5432,
            DB_NAME: 'splife',
        }
    },
    coreul: {
        SIT: {
            DB_USER: 'coreulread',
            DB_PASSWORD: 'nopass',
            DB_HOST: '11.100.7.54',
            DB_PORT: 5432,
            DB_NAME: 'coreul',
        },
        SIT_EDIT: {
            DB_USER: 'coreulqa',
            DB_PASSWORD: 'KewCoURHQp',
            DB_HOST: '11.100.7.54',
            DB_PORT: 5432,
            DB_NAME: 'coreul',
        },
        UAT: {
            DB_USER: 'coreulread',
            DB_PASSWORD: 'nopass',
            DB_HOST: '11.100.7.58',
            DB_PORT: 5432,
            DB_NAME: 'coreul',
        },
        UAT_EDIT: {
            DB_USER: 'suladda',
            DB_PASSWORD: '8vp^cv]9102',
            DB_HOST: '11.100.7.58',
            DB_PORT: 5432,
            DB_NAME: 'coreul',
        }
    },
    alteration: {
        SIT: {
            DB_USER: '',
            DB_PASSWORD: '',
            DB_HOST: '',
            DB_PORT: 5432,
            DB_NAME: 'alter',
        },
        SIT_EDIT: {
            DB_USER: 'alter',
            DB_PASSWORD: 'nopass',
            DB_HOST: '11.100.8.105',
            DB_PORT: 5432,
            DB_NAME: 'alter',
        },
        UAT: {
            DB_USER: '',
            DB_PASSWORD: '',
            DB_HOST: '',
            DB_PORT: 5432,
            DB_NAME: 'alter',
        },
        UAT_EDIT: {
            DB_USER: '',
            DB_PASSWORD: '',
            DB_HOST: '',
            DB_PORT: 5432,
            DB_NAME: 'alter',
        }
    }
}

module.exports = { configdb };