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
        }
    }
}

module.exports = { configdb };