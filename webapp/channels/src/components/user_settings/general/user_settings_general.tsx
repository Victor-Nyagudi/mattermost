// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

/* eslint-disable max-lines */

import React, {PureComponent} from 'react';
import {defineMessage, defineMessages, FormattedDate, FormattedMessage, FormattedList, injectIntl} from 'react-intl';
import type {IntlShape} from 'react-intl';
import ReactSelect from 'react-select';
import type {OnChangeValue, ActionMeta, StylesConfig} from 'react-select';

import type {UserPropertyField, PropertyFieldOption} from '@mattermost/types/properties';
import type {UserProfile} from '@mattermost/types/users';

import type {LogErrorOptions} from 'mattermost-redux/actions/errors';
import {LogErrorBarMode} from 'mattermost-redux/actions/errors';
import type {ActionResult} from 'mattermost-redux/types/actions';
import {isEmail} from 'mattermost-redux/utils/helpers';

import {trackEvent} from 'actions/telemetry_actions.jsx';

import SettingItem from 'components/setting_item';
import SettingItemMax from 'components/setting_item_max';
import SettingPicture from 'components/setting_picture';
import Input from 'components/widgets/inputs/input/input';
import LoadingWrapper from 'components/widgets/loading/loading_wrapper';

import {AnnouncementBarMessages, AnnouncementBarTypes, AcceptedProfileImageTypes, Constants, ValidationErrors} from 'utils/constants';
import {validHttpUrl} from 'utils/url';
import * as Utils from 'utils/utils';

import SettingDesktopHeader from '../headers/setting_desktop_header';
import SettingMobileHeader from '../headers/setting_mobile_header';

const holders = defineMessages({
    usernameReserved: {
        id: 'user.settings.general.usernameReserved',
        defaultMessage: 'This username is reserved, please choose a new one.',
    },
    usernameGroupNameUniqueness: {
        id: 'user.settings.general.usernameGroupNameUniqueness',
        defaultMessage: 'This username conflicts with an existing group name.',
    },
    usernameRestrictions: {
        id: 'user.settings.general.usernameRestrictions',
        defaultMessage: "Username must begin with a letter, and contain between {min} to {max} lowercase characters made up of numbers, letters, and the symbols '.', '-', and '_'.",
    },
    validEmail: {
        id: 'user.settings.general.validEmail',
        defaultMessage: 'Please enter a valid email address.',
    },
    validUrl: {
        id: 'user.settings.general.validUrl',
        defaultMessage: 'Please enter a valid url.',
    },
    emailMatch: {
        id: 'user.settings.general.emailMatch',
        defaultMessage: 'The new emails you entered do not match.',
    },
    incorrectPassword: {
        id: 'user.settings.general.incorrectPassword',
        defaultMessage: 'Your password is incorrect.',
    },
    emptyPassword: {
        id: 'user.settings.general.emptyPassword',
        defaultMessage: 'Please enter your current password.',
    },
    validImage: {
        id: 'user.settings.general.validImage',
        defaultMessage: 'Only BMP, JPG, JPEG, or PNG images may be used for profile pictures',
    },
    imageTooLarge: {
        id: 'user.settings.general.imageTooLarge',
        defaultMessage: 'Unable to upload profile image. File is too large.',
    },
    uploadImage: {
        id: 'user.settings.general.uploadImage',
        defaultMessage: "Click 'Edit' to upload an image.",
    },
    uploadImageMobile: {
        id: 'user.settings.general.mobile.uploadImage',
        defaultMessage: 'Click to upload an image',
    },
    fullName: {
        id: 'user.settings.general.fullName',
        defaultMessage: 'Full Name',
    },
    nickname: {
        id: 'user.settings.general.nickname',
        defaultMessage: 'Nickname',
    },
    username: {
        id: 'user.settings.general.username',
        defaultMessage: 'Username',
    },
    profilePicture: {
        id: 'user.settings.general.profilePicture',
        defaultMessage: 'Profile Picture',
    },
    close: {
        id: 'user.settings.general.close',
        defaultMessage: 'Close',
    },
    position: {
        id: 'user.settings.general.position',
        defaultMessage: 'Position',
    },
});

export type SelectOption = {
    value: string;
    label: string;
};

const selectStyles: StylesConfig<SelectOption, true> = {
    valueContainer: (baseStyles) => ({
        ...baseStyles,
        height: 'auto',
        minHeight: '38px',
        flexWrap: 'wrap',
        whiteSpace: 'normal',
    }),
    multiValue: (baseStyles) => ({
        ...baseStyles,
        margin: '2px',
    }),
    control: (baseStyles) => ({
        ...baseStyles,
        height: 'auto',
        minHeight: '38px',
    }),
    multiValueLabel: (baseStyles) => ({
        ...baseStyles,
        padding: '2px 6px',
    }),
};

export type Props = {
    intl: IntlShape;
    user: UserProfile;
    updateSection: (section: string) => void;
    updateTab: (notifications: string) => void;
    activeSection?: string;
    closeModal: () => void;
    collapseModal: () => void;
    isMobileView: boolean;
    maxFileSize: number;
    customProfileAttributeFields: UserPropertyField[];
    actions: {
        logError: ({message, type}: {message: any; type: string}, options?: LogErrorOptions) => void;
        clearErrors: () => void;
        updateMe: (user: UserProfile) => Promise<ActionResult>;
        sendVerificationEmail: (email: string) => Promise<ActionResult>;
        setDefaultProfileImage: (id: string) => void;
        uploadProfileImage: (id: string, file: File) => Promise<ActionResult>;
        getCustomProfileAttributeValues: (userID: string) => Promise<ActionResult<Record<string, string | string[]>>>;
        saveCustomProfileAttribute: (userID: string, attributeID: string, attributeValue: string | string[]) => Promise<ActionResult<Record<string, string | string[]>>>;
    };
    requireEmailVerification?: boolean;
    ldapFirstNameAttributeSet?: boolean;
    ldapLastNameAttributeSet?: boolean;
    samlFirstNameAttributeSet?: boolean;
    samlLastNameAttributeSet?: boolean;
    ldapNicknameAttributeSet?: boolean;
    samlNicknameAttributeSet?: boolean;
    ldapPositionAttributeSet?: boolean;
    samlPositionAttributeSet?: boolean;
    ldapPictureAttributeSet?: boolean;
    enableCustomProfileAttributes: boolean;
}

type State = {
    username: string;
    firstName: string;
    lastName: string;
    nickname: string;
    position: string;
    originalEmail: string;
    email: string;
    confirmEmail: string;
    currentPassword: string;
    pictureFile: File | null;
    loadingPicture: boolean;
    sectionIsSaving: boolean;
    showSpinner: boolean;
    resendStatus?: string;
    pictureError?: string | null;
    serverError?: string | {server_error_id: string; message: string};
    emailError?: string;
    customAttributeValues: Record<string, string | string[]>;
}

export class UserSettingsGeneralTab extends PureComponent<Props, State> {
    public submitActive = false;

    constructor(props: Props) {
        super(props);
        this.state = this.setupInitialState(props);
    }

    componentDidMount() {
        if (this.props.enableCustomProfileAttributes && !this.props.user.custom_profile_attributes) {
            this.props.actions.getCustomProfileAttributeValues(this.props.user.id);
        }
    }

    handleEmailResend = (email: string) => {
        this.setState({resendStatus: 'sending', showSpinner: true});
        this.props.actions.sendVerificationEmail(email).then(({data, error: err}) => {
            if (data) {
                this.setState({resendStatus: 'success'});
            } else if (err) {
                this.setState({resendStatus: 'failure'});
            }
        });
    };

    createEmailResendLink = (email: string) => {
        return (
            <span className='resend-verification-wrapper'>
                <LoadingWrapper
                    loading={this.state.showSpinner}
                    text={defineMessage({id: 'user.settings.general.sending', defaultMessage: 'Sending'})}
                >
                    <a
                        onClick={() => {
                            this.handleEmailResend(email);
                            setTimeout(() => {
                                this.setState({
                                    showSpinner: false,
                                });
                            }, 500);
                        }}
                    >
                        <FormattedMessage
                            id='user.settings.general.sendAgain'
                            defaultMessage='Send again'
                        />
                    </a>
                </LoadingWrapper>
            </span>
        );
    };

    submitUsername = () => {
        const user = Object.assign({}, this.props.user);
        const username = this.state.username.trim().toLowerCase();

        if (user.username === username) {
            this.updateSection('');
            return;
        }

        user.username = username;

        trackEvent('settings', 'user_settings_update', {field: 'username'});

        this.submitUser(user, false);
    };

    submitNickname = () => {
        const user = Object.assign({}, this.props.user);
        const nickname = this.state.nickname.trim();

        if (user.nickname === nickname) {
            this.updateSection('');
            return;
        }

        user.nickname = nickname;

        trackEvent('settings', 'user_settings_update', {field: 'nickname'});

        this.submitUser(user, false);
    };

    submitName = () => {
        const user = Object.assign({}, this.props.user);
        const firstName = this.state.firstName.trim();
        const lastName = this.state.lastName.trim();

        if (user.first_name === firstName && user.last_name === lastName) {
            this.updateSection('');
            return;
        }

        user.first_name = firstName;
        user.last_name = lastName;

        trackEvent('settings', 'user_settings_update', {field: 'fullname'});

        this.submitUser(user, false);
    };

    submitEmail = () => {
        const user = Object.assign({}, this.props.user);
        const email = this.state.email.trim().toLowerCase();
        const confirmEmail = this.state.confirmEmail.trim().toLowerCase();
        const currentPassword = this.state.currentPassword;

        if (email === user.email && (confirmEmail === '' || confirmEmail === user.email)) {
            this.updateSection('');
            return;
        }

        user.email = email;
        user.password = currentPassword;
        trackEvent('settings', 'user_settings_update', {field: 'email'});
        this.submitUser(user, true);
    };

    isEmailValid = () => {
        const email = this.state.email.trim().toLowerCase();
        const confirmEmail = this.state.confirmEmail.trim().toLowerCase();
        const currentPassword = this.state.currentPassword;

        if (email === '' || !isEmail(email)) {
            return false;
        }

        if (email !== confirmEmail) {
            return false;
        }

        if (currentPassword === '') {
            return false;
        }

        return true;
    };

    submitUser = (user: UserProfile, emailUpdated: boolean) => {
        const {formatMessage} = this.props.intl;
        this.setState({sectionIsSaving: true});

        this.props.actions.updateMe(user).
            then(({data, error: err}) => {
                if (data) {
                    this.updateSection('');

                    const verificationEnabled = this.props.requireEmailVerification && emailUpdated;
                    if (verificationEnabled) {
                        this.props.actions.clearErrors();
                        this.props.actions.logError({
                            message: AnnouncementBarMessages.EMAIL_VERIFICATION_REQUIRED,
                            type: AnnouncementBarTypes.SUCCESS,
                        }, {errorBarMode: LogErrorBarMode.Always});
                    }
                } else if (err) {
                    let serverError;
                    if (err.server_error_id &&
                        err.server_error_id === 'api.user.check_user_password.invalid.app_error') {
                        serverError = formatMessage(holders.incorrectPassword);
                    } else if (err.server_error_id === 'app.user.group_name_conflict') {
                        serverError = formatMessage(holders.usernameGroupNameUniqueness);
                    } else if (err.message) {
                        serverError = err.message;
                    } else {
                        serverError = err;
                    }
                    this.setState({serverError, emailError: '', sectionIsSaving: false});
                }
            });
    };

    setDefaultProfilePicture = async () => {
        try {
            await this.props.actions.setDefaultProfileImage(this.props.user.id);
            this.updateSection('');
            this.submitActive = false;
        } catch (err) {
            let serverError;
            if (err.message) {
                serverError = err.message;
            } else {
                serverError = err;
            }
            this.setState({serverError, emailError: '', pictureError: '', sectionIsSaving: false});
        }
    };

    submitPicture = () => {
        if (!this.state.pictureFile) {
            return;
        }

        if (!this.submitActive) {
            return;
        }

        trackEvent('settings', 'user_settings_update', {field: 'picture'});

        const {formatMessage} = this.props.intl;
        const file = this.state.pictureFile;

        if (!AcceptedProfileImageTypes.includes(file.type)) {
            this.setState({pictureError: formatMessage(holders.validImage), serverError: ''});
            return;
        } else if (file.size > this.props.maxFileSize) {
            this.setState({pictureError: formatMessage(holders.imageTooLarge), serverError: ''});
            return;
        }

        this.setState({loadingPicture: true});

        this.props.actions.uploadProfileImage(this.props.user.id, file).
            then(({data, error: err}) => {
                if (data) {
                    this.updateSection('');
                    this.submitActive = false;
                } else if (err) {
                    const state = this.setupInitialState(this.props);
                    state.serverError = err.message;
                    this.setState(state);
                }
            });
    };

    submitPosition = () => {
        const user = Object.assign({}, this.props.user);
        const position = this.state.position.trim();

        if (user.position === position) {
            this.updateSection('');
            return;
        }

        user.position = position;

        trackEvent('settings', 'user_settings_update', {field: 'position'});

        this.submitUser(user, false);
    };

    submitAttribute = async (settings: string[]) => {
        const attributeID = settings[0];
        const attributeField = this.props.customProfileAttributeFields.find((field) => field.id === attributeID);
        if (attributeField === undefined) {
            return;
        }
        let attributeValue: string | string[] = this.state.customAttributeValues?.[attributeID];

        if (typeof attributeValue === 'string' && attributeField.attrs && attributeField.attrs.value_type) {
            if (attributeField.attrs.value_type === 'email') {
                if (attributeValue !== '' && !isEmail(attributeValue)) {
                    this.setState({emailError: '', serverError: ''});
                    return;
                }
            }
            if (attributeField.attrs.value_type === 'url') {
                if (attributeValue !== '') {
                    const validURL = validHttpUrl(attributeValue);
                    if (!validURL) {
                        this.setState({emailError: '', serverError: ''});
                        return;
                    }
                    let validLink = validURL.toString();
                    if (validLink.endsWith('/')) {
                        validLink = validLink.slice(0, -1);
                    }
                    attributeValue = validLink;
                }
            }
        }
        if (attributeField.type === 'multiselect' && !attributeValue) {
            attributeValue = [];
        }
        trackEvent('settings', 'user_settings_update', {field: 'customAttributeValues-' + attributeID});

        this.setState({sectionIsSaving: true});

        this.props.actions.saveCustomProfileAttribute(this.props.user.id, attributeID, attributeValue as string).
            then(({data, error: err}) => {
                if (data) {
                    this.updateSection('');
                    this.setState({customAttributeValues: {...this.state.customAttributeValues, ...data}});
                } else if (err) {
                    const serverError = err.message;
                    this.setState({serverError, emailError: '', sectionIsSaving: false});
                }
            });
    };

    updateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({username: e.target.value});
    };

    updateFirstName = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({firstName: e.target.value});
    };

    updateLastName = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({lastName: e.target.value});
    };

    updateNickname = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({nickname: e.target.value});
    };

    updatePosition = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({position: e.target.value});
    };

    updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({email: e.target.value});
    };

    updateConfirmEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({confirmEmail: e.target.value});
    };

    updateCurrentPassword = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({currentPassword: e.target.value});
    };

    updatePicture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            this.setState({pictureFile: e.target.files[0]});

            this.submitActive = true;
            this.setState({pictureError: null});
        } else {
            this.setState({pictureFile: null});
        }
    };

    updateSelectAttribute = (selectedOption: OnChangeValue<SelectOption, boolean>, action: ActionMeta<SelectOption>, fieldID: string) => {
        const attributeValues = {...this.state.customAttributeValues};

        if (!selectedOption) {
            attributeValues[fieldID] = '';
        } else if (Array.isArray(selectedOption)) {
            // Handle multi-select
            attributeValues[fieldID] = selectedOption.
                filter((option): option is SelectOption =>
                    Boolean(option && Object.hasOwn(option, 'value'))).
                map((option) => option.value);
        } else if ('value' in selectedOption) {
            // Handle single select
            attributeValues[fieldID] = selectedOption.value || '';
        } else {
            attributeValues[fieldID] = '';
        }

        this.setState({customAttributeValues: attributeValues});
    };

    updateAttribute = (e: React.ChangeEvent<HTMLInputElement>) => {
        const attributeValues = Object.assign({}, this.state.customAttributeValues);
        const id = e.target.id.substring(e.target.id.indexOf('_') + 1);
        attributeValues[id] = e.target.value;
        this.setState({customAttributeValues: attributeValues});
    };

    updateSection = (section: string) => {
        this.setState(Object.assign({}, this.setupInitialState(this.props), {pictureError: '', serverError: '', emailError: '', sectionIsSaving: false}));
        this.submitActive = false;
        this.props.updateSection(section);
    };

    setupInitialState(props: Props) {
        const user = props.user;
        return {
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            nickname: user.nickname,
            position: user.position,
            originalEmail: user.email,
            email: '',
            confirmEmail: '',
            currentPassword: '',
            pictureFile: null,
            loadingPicture: false,
            sectionIsSaving: false,
            showSpinner: false,
            serverError: '',
            customAttributeValues: user.custom_profile_attributes || {},
        };
    }

    createEmailSection() {
        const {formatMessage} = this.props.intl;

        const active = this.props.activeSection === 'email';
        let max = null;
        if (active) {
            const emailVerificationEnabled = this.props.requireEmailVerification;
            const inputs = [];

            let helpText = (
                <FormattedMessage
                    id='user.settings.general.emailHelp1'
                    defaultMessage='Email is used for sign-in, notifications, and password reset. Email requires verification if changed.'
                />
            );

            if (!emailVerificationEnabled) {
                helpText = (
                    <FormattedMessage
                        id='user.settings.general.emailHelp3'
                        defaultMessage='Email is used for sign-in, notifications, and password reset.'
                    />
                );
            }

            let submit = null;

            if (this.props.user.auth_service === '') {
                inputs.push(
                    <div key='currentEmailSetting'>
                        <div className='form-group'>
                            <span className='as-bs-label col-sm-5 control-label'>
                                <FormattedMessage
                                    id='user.settings.general.currentEmail'
                                    defaultMessage='Current Email'
                                />
                            </span>
                            <div className='col-sm-7'>
                                <span className='as-bs-label control-label word-break--all text-left'>{this.state.originalEmail}</span>
                            </div>
                        </div>
                    </div>,
                );

                inputs.push(
                    <div key='emailSetting'>
                        <div className='form-group'>
                            <label
                                className='col-sm-5 control-label'
                                htmlFor='primaryEmail'
                            >
                                <FormattedMessage
                                    id='user.settings.general.newEmail'
                                    defaultMessage='New Email'
                                />
                            </label>
                            <div className='col-sm-7'>
                                <Input
                                    autoFocus={true}
                                    id='primaryEmail'
                                    name='primaryEmail'
                                    type='email'
                                    onChange={this.updateEmail}
                                    maxLength={Constants.MAX_EMAIL_LENGTH}
                                    value={this.state.email}
                                    aria-label={formatMessage({id: 'user.settings.general.newEmail', defaultMessage: 'New Email'})}
                                    validate={(value) => {
                                        if (value === '' || !isEmail(value as string)) {
                                            return {
                                                type: 'error',
                                                value: formatMessage(holders.validEmail),
                                            };
                                        }
                                        return undefined;
                                    }}
                                />
                            </div>
                        </div>
                    </div>,
                );

                inputs.push(
                    <div key='confirmEmailSetting'>
                        <div className='form-group'>
                            <label
                                className='col-sm-5 control-label'
                                htmlFor='confirmEmail'
                            >
                                <FormattedMessage
                                    id='user.settings.general.confirmEmail'
                                    defaultMessage='Confirm Email'
                                />
                            </label>
                            <div className='col-sm-7'>
                                <Input
                                    id='confirmEmail'
                                    name='confirmEmail'
                                    type='email'
                                    onChange={this.updateConfirmEmail}
                                    maxLength={Constants.MAX_EMAIL_LENGTH}
                                    value={this.state.confirmEmail}
                                    aria-label={formatMessage({id: 'user.settings.general.confirmEmail', defaultMessage: 'Confirm Email'})}
                                    validate={(value) => {
                                        if (this.state.email !== value) {
                                            return {
                                                type: 'error',
                                                value: formatMessage(holders.emailMatch),
                                            };
                                        }
                                        return undefined;
                                    }}
                                />
                            </div>
                        </div>
                    </div>,
                );

                inputs.push(
                    <div key='currentPassword'>
                        <div className='form-group'>
                            <label
                                className='col-sm-5 control-label'
                                htmlFor='currentPassword'
                            >
                                <FormattedMessage
                                    id='user.settings.general.currentPassword'
                                    defaultMessage='Current Password'
                                />
                            </label>
                            <div className='col-sm-7'>
                                <Input
                                    id='currentPassword'
                                    name='currentPassword'
                                    type='password'
                                    onChange={this.updateCurrentPassword}
                                    value={this.state.currentPassword}
                                    aria-label={formatMessage({id: 'user.settings.general.currentPassword', defaultMessage: 'Current Password'})}
                                    validate={(value) => {
                                        if (value === '') {
                                            return {
                                                type: 'error',
                                                value: formatMessage(holders.emptyPassword),
                                            };
                                        }
                                        return undefined;
                                    }}
                                />
                            </div>
                        </div>
                        {helpText}
                    </div>,
                );

                submit = this.submitEmail;
            } else if (this.props.user.auth_service === Constants.GITLAB_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint pb-3'>
                            <FormattedMessage
                                id='user.settings.general.emailGitlabCantUpdate'
                                defaultMessage='Login occurs through GitLab. Email cannot be updated. Email address used for notifications is {email}.'
                                values={{
                                    email: this.state.originalEmail,
                                }}
                            />
                        </div>
                        {helpText}
                    </div>,
                );
            } else if (this.props.user.auth_service === Constants.GOOGLE_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint pb-3'>
                            <FormattedMessage
                                id='user.settings.general.emailGoogleCantUpdate'
                                defaultMessage='Login occurs through Google Apps. Email cannot be updated. Email address used for notifications is {email}.'
                                values={{
                                    email: this.state.originalEmail,
                                }}
                            />
                        </div>
                        {helpText}
                    </div>,
                );
            } else if (this.props.user.auth_service === Constants.OFFICE365_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint pb-3'>
                            <FormattedMessage
                                id='user.settings.general.emailOffice365CantUpdate'
                                defaultMessage='Login occurs through Entra ID. Email cannot be updated. Email address used for notifications is {email}.'
                                values={{
                                    email: this.state.originalEmail,
                                }}
                            />
                        </div>
                        {helpText}
                    </div>,
                );
            } else if (this.props.user.auth_service === Constants.OPENID_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='form-group'
                    >
                        <div className='setting-list__hint pb-3'>
                            <FormattedMessage
                                id='user.settings.general.emailOpenIdCantUpdate'
                                defaultMessage='Login occurs through OpenID Connect. Email cannot be updated. Email address used for notifications is {email}.'
                                values={{
                                    email: this.state.originalEmail,
                                }}
                            />
                        </div>
                        {helpText}
                    </div>,
                );
            } else if (this.props.user.auth_service === Constants.LDAP_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='pb-2'
                    >
                        <div className='setting-list__hint pb-3'>
                            <FormattedMessage
                                id='user.settings.general.emailLdapCantUpdate'
                                defaultMessage='Login occurs through AD/LDAP. Email cannot be updated. Email address used for notifications is {email}.'
                                values={{
                                    email: this.state.originalEmail,
                                }}
                            />
                        </div>
                    </div>,
                );
            } else if (this.props.user.auth_service === Constants.SAML_SERVICE) {
                inputs.push(
                    <div
                        key='oauthEmailInfo'
                        className='pb-2'
                    >
                        <div className='setting-list__hint pb-3'>
                            <FormattedMessage
                                id='user.settings.general.emailSamlCantUpdate'
                                defaultMessage='Login occurs through SAML. Email cannot be updated. Email address used for notifications is {email}.'
                                values={{
                                    email: this.state.originalEmail,
                                }}
                            />
                        </div>
                        {helpText}
                    </div>,
                );
            }

            max = (
                <SettingItemMax
                    title={
                        <FormattedMessage
                            id='user.settings.general.email'
                            defaultMessage='Email'
                        />
                    }
                    inputs={inputs}
                    submit={submit}
                    saving={this.state.sectionIsSaving}
                    serverError={this.state.serverError}
                    updateSection={this.updateSection}
                    isValid={this.isEmailValid()}
                />
            );
        }

        let describe: JSX.Element|string = '';
        if (this.props.user.auth_service === '') {
            describe = this.props.user.email;
        } else if (this.props.user.auth_service === Constants.GITLAB_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.general.loginGitlab'
                    defaultMessage='Login done through GitLab ({email})'
                    values={{
                        email: this.state.originalEmail,
                    }}
                />
            );
        } else if (this.props.user.auth_service === Constants.GOOGLE_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.general.loginGoogle'
                    defaultMessage='Login done through Google Apps ({email})'
                    values={{
                        email: this.state.originalEmail,
                    }}
                />
            );
        } else if (this.props.user.auth_service === Constants.OFFICE365_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.general.loginOffice365'
                    defaultMessage='Login done through Entra ID ({email})'
                    values={{
                        email: this.state.originalEmail,
                    }}
                />
            );
        } else if (this.props.user.auth_service === Constants.LDAP_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.general.loginLdap'
                    defaultMessage='Login done through AD/LDAP ({email})'
                    values={{
                        email: this.state.originalEmail,
                    }}
                />
            );
        } else if (this.props.user.auth_service === Constants.SAML_SERVICE) {
            describe = (
                <FormattedMessage
                    id='user.settings.general.loginSaml'
                    defaultMessage='Login done through SAML ({email})'
                    values={{
                        email: this.state.originalEmail,
                    }}
                />
            );
        }

        return (
            <SettingItem
                active={active}
                areAllSectionsInactive={this.props.activeSection === ''}
                title={
                    <FormattedMessage
                        id='user.settings.general.email'
                        defaultMessage='Email'
                    />
                }
                describe={describe}
                section={'email'}
                updateSection={this.updateSection}
                max={max}
            />
        );
    }

    createNameSection = () => {
        const user = this.props.user;
        const {formatMessage} = this.props.intl;

        const active = this.props.activeSection === 'name';
        let max = null;
        if (active) {
            const inputs = [];

            let extraInfo;
            let submit = null;
            if (
                (this.props.user.auth_service === Constants.LDAP_SERVICE &&
                    (this.props.ldapFirstNameAttributeSet || this.props.ldapLastNameAttributeSet)) ||
                (this.props.user.auth_service === Constants.SAML_SERVICE &&
                    (this.props.samlFirstNameAttributeSet || this.props.samlLastNameAttributeSet)) ||
                (Constants.OAUTH_SERVICES.includes(this.props.user.auth_service))
            ) {
                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.field_handled_externally'
                            defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                        />
                    </span>
                );
            } else {
                inputs.push(
                    <div
                        key='firstNameSetting'
                        className='form-group'
                    >
                        <label
                            className='col-sm-5 control-label'
                            htmlFor='firstName'
                        >
                            <FormattedMessage
                                id='user.settings.general.firstName'
                                defaultMessage='First Name'
                            />
                        </label>
                        <div className='col-sm-7'>
                            <Input
                                id='firstName'
                                name='firstName'
                                autoFocus={true}
                                type='text'
                                onChange={this.updateFirstName}
                                maxLength={Constants.MAX_FIRSTNAME_LENGTH}
                                value={this.state.firstName}
                                onFocus={Utils.moveCursorToEnd}
                                aria-label={formatMessage({id: 'user.settings.general.firstName', defaultMessage: 'First Name'})}
                            />
                        </div>
                    </div>,
                );

                inputs.push(
                    <div
                        key='lastNameSetting'
                        className='form-group'
                    >
                        <label
                            className='col-sm-5 control-label'
                            htmlFor='lastName'
                        >
                            <FormattedMessage
                                id='user.settings.general.lastName'
                                defaultMessage='Last Name'
                            />
                        </label>
                        <div className='col-sm-7'>
                            <Input
                                id='lastName'
                                name='lastName'
                                type='text'
                                onChange={this.updateLastName}
                                maxLength={Constants.MAX_LASTNAME_LENGTH}
                                value={this.state.lastName}
                                aria-label={formatMessage({id: 'user.settings.general.lastName', defaultMessage: 'Last Name'})}
                            />
                        </div>
                    </div>,
                );

                const notifClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    this.updateSection('');
                    this.props.updateTab('notifications');
                };

                const notifLink = (
                    <a
                        href='#'
                        onClick={notifClick.bind(this)}
                    >
                        <FormattedMessage
                            id='user.settings.general.notificationsLink'
                            defaultMessage='Notifications'
                        />
                    </a>
                );

                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.notificationsExtra'
                            defaultMessage='By default, you will receive mention notifications when someone types your first name. Go to {notify} settings to change this default.'
                            values={{
                                notify: (notifLink),
                            }}
                        />
                    </span>
                );

                submit = this.submitName;
            }

            max = (
                <SettingItemMax
                    title={formatMessage(holders.fullName)}
                    inputs={inputs}
                    submit={submit}
                    saving={this.state.sectionIsSaving}
                    serverError={this.state.serverError}
                    updateSection={this.updateSection}
                    extraInfo={extraInfo}
                />
            );
        }

        let describe: JSX.Element|string = '';

        if (user.first_name && user.last_name) {
            describe = user.first_name + ' ' + user.last_name;
        } else if (user.first_name) {
            describe = user.first_name;
        } else if (user.last_name) {
            describe = user.last_name;
        } else {
            describe = (
                <FormattedMessage
                    id='user.settings.general.emptyName'
                    defaultMessage="Click 'Edit' to add your full name"
                />
            );
            if (this.props.isMobileView) {
                describe = (
                    <FormattedMessage
                        id='user.settings.general.mobile.emptyName'
                        defaultMessage='Click to add your full name'
                    />
                );
            }
        }

        return (
            <SettingItem
                active={active}
                areAllSectionsInactive={this.props.activeSection === ''}
                title={formatMessage(holders.fullName)}
                describe={describe}
                section={'name'}
                updateSection={this.updateSection}
                max={max}
            />
        );
    };

    createNicknameSection = () => {
        const user = this.props.user;
        const {formatMessage} = this.props.intl;

        const active = this.props.activeSection === 'nickname';
        let max = null;
        if (active) {
            const inputs = [];

            let extraInfo;
            let submit = null;
            if ((this.props.user.auth_service === 'ldap' && this.props.ldapNicknameAttributeSet) || (this.props.user.auth_service === Constants.SAML_SERVICE && this.props.samlNicknameAttributeSet)) {
                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.field_handled_externally'
                            defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                        />
                    </span>
                );
            } else {
                let nicknameLabel: JSX.Element|string = (
                    <FormattedMessage
                        id='user.settings.general.nickname'
                        defaultMessage='Nickname'
                    />
                );
                if (this.props.isMobileView) {
                    nicknameLabel = '';
                }

                inputs.push(
                    <div
                        key='nicknameSetting'
                        className='form-group'
                    >
                        <label className='col-sm-5 control-label'>{nicknameLabel}</label>
                        <div className='col-sm-7'>
                            <Input
                                id='nickname'
                                name='nickname'
                                autoFocus={true}
                                type='text'
                                onChange={this.updateNickname}
                                value={this.state.nickname}
                                maxLength={Constants.MAX_NICKNAME_LENGTH}
                                autoCapitalize='off'
                                aria-label={formatMessage({id: 'user.settings.general.nickname', defaultMessage: 'Nickname'})}
                            />
                        </div>
                    </div>,
                );

                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.nicknameExtra'
                            defaultMessage='Use Nickname for a name you might be called that is different from your first name and username. This is most often used when two or more people have similar sounding names and usernames.'
                        />
                    </span>
                );

                submit = this.submitNickname;
            }

            max = (
                <SettingItemMax
                    title={formatMessage(holders.nickname)}
                    inputs={inputs}
                    submit={submit}
                    saving={this.state.sectionIsSaving}
                    serverError={this.state.serverError}
                    updateSection={this.updateSection}
                    extraInfo={extraInfo}
                />
            );
        }

        let describe: JSX.Element|string = '';
        if (user.nickname) {
            describe = user.nickname;
        } else {
            describe = (
                <FormattedMessage
                    id='user.settings.general.emptyNickname'
                    defaultMessage="Click 'Edit' to add a nickname"
                />
            );
            if (this.props.isMobileView) {
                describe = (
                    <FormattedMessage
                        id='user.settings.general.mobile.emptyNickname'
                        defaultMessage='Click to add a nickname'
                    />
                );
            }
        }

        return (
            <SettingItem
                active={active}
                areAllSectionsInactive={this.props.activeSection === ''}
                title={formatMessage(holders.nickname)}
                describe={describe}
                section={'nickname'}
                updateSection={this.updateSection}
                max={max}
            />
        );
    };

    createUsernameSection = () => {
        const {formatMessage} = this.props.intl;

        const active = this.props.activeSection === 'username';
        let max = null;
        if (active) {
            const inputs = [];

            let extraInfo;
            let submit = null;
            if (this.props.user.auth_service === '') {
                let usernameLabel: JSX.Element | string = (
                    <FormattedMessage
                        id='user.settings.general.username'
                        defaultMessage='Username'
                    />
                );
                if (this.props.isMobileView) {
                    usernameLabel = '';
                }

                inputs.push(
                    <div
                        key='usernameSetting'
                        className='form-group'
                    >
                        <label className='col-sm-5 control-label'>{usernameLabel}</label>
                        <div className='col-sm-7'>
                            <Input
                                id='username'
                                name='username'
                                autoFocus={true}
                                maxLength={Constants.MAX_USERNAME_LENGTH}
                                type='text'
                                onChange={this.updateUsername}
                                value={this.state.username}
                                autoCapitalize='off'
                                onFocus={Utils.moveCursorToEnd}
                                aria-label={formatMessage({id: 'user.settings.general.username', defaultMessage: 'Username'})}
                                validate={(value) => {
                                    const usernameError = Utils.isValidUsername(value as string);
                                    if (usernameError) {
                                        if (usernameError.id === ValidationErrors.RESERVED_NAME) {
                                            return {
                                                type: 'error',
                                                value: formatMessage(holders.usernameReserved),
                                            };
                                        }
                                        return {
                                            type: 'error',
                                            value: formatMessage(holders.usernameRestrictions, {min: Constants.MIN_USERNAME_LENGTH, max: Constants.MAX_USERNAME_LENGTH}),
                                        };
                                    }
                                    return undefined;
                                }}
                            />
                        </div>
                    </div>,
                );

                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.usernameInfo'
                            defaultMessage='Pick something easy for teammates to recognize and recall.'
                        />
                    </span>
                );

                submit = this.submitUsername;
            } else {
                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.field_handled_externally'
                            defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                        />
                    </span>
                );
            }

            max = (
                <SettingItemMax
                    title={formatMessage(holders.username)}
                    inputs={inputs}
                    submit={submit}
                    saving={this.state.sectionIsSaving}
                    serverError={this.state.serverError}
                    updateSection={this.updateSection}
                    extraInfo={extraInfo}
                    isValid={Utils.isValidUsername(this.state.username) === undefined}
                />
            );
        }
        return (
            <SettingItem
                active={active}
                areAllSectionsInactive={this.props.activeSection === ''}
                title={formatMessage(holders.username)}
                describe={this.props.user.username}
                section={'username'}
                updateSection={this.updateSection}
                max={max}
            />
        );
    };

    createPositionSection = () => {
        const user = this.props.user;
        const {formatMessage} = this.props.intl;

        const active = this.props.activeSection === 'position';
        let max = null;
        if (active) {
            const inputs = [];

            let extraInfo: JSX.Element|string;
            let submit = null;
            if ((this.props.user.auth_service === Constants.LDAP_SERVICE && this.props.ldapPositionAttributeSet) || (this.props.user.auth_service === Constants.SAML_SERVICE && this.props.samlPositionAttributeSet)) {
                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.field_handled_externally'
                            defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                        />
                    </span>
                );
            } else {
                let positionLabel: JSX.Element | string = (
                    <FormattedMessage
                        id='user.settings.general.position'
                        defaultMessage='Position'
                    />
                );
                if (this.props.isMobileView) {
                    positionLabel = '';
                }

                inputs.push(
                    <div
                        key='positionSetting'
                        className='form-group'
                    >
                        <label className='col-sm-5 control-label'>{positionLabel}</label>
                        <div className='col-sm-7'>
                            <Input
                                id='position'
                                name='position'
                                autoFocus={true}
                                type='text'
                                onChange={this.updatePosition}
                                value={this.state.position}
                                maxLength={Constants.MAX_POSITION_LENGTH}
                                autoCapitalize='off'
                                onFocus={Utils.moveCursorToEnd}
                                aria-label={formatMessage({id: 'user.settings.general.position', defaultMessage: 'Position'})}
                            />
                        </div>
                    </div>,
                );

                extraInfo = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.positionExtra'
                            defaultMessage='Use Position for your role or job title. This will be shown in your profile popover.'
                        />
                    </span>
                );

                submit = this.submitPosition;
            }

            max = (
                <SettingItemMax
                    title={formatMessage(holders.position)}
                    inputs={inputs}
                    submit={submit}
                    saving={this.state.sectionIsSaving}
                    serverError={this.state.serverError}
                    updateSection={this.updateSection}
                    extraInfo={extraInfo}
                />
            );
        }

        let describe: JSX.Element|string = '';
        if (user.position) {
            describe = user.position;
        } else {
            describe = (
                <FormattedMessage
                    id='user.settings.general.emptyPosition'
                    defaultMessage="Click 'Edit' to add your job title / position"
                />
            );
            if (this.props.isMobileView) {
                describe = (
                    <FormattedMessage
                        id='user.settings.general.mobile.emptyPosition'
                        defaultMessage='Click to add your job title / position'
                    />
                );
            }
        }

        return (
            <SettingItem
                active={active}
                areAllSectionsInactive={this.props.activeSection === ''}
                title={formatMessage(holders.position)}
                describe={describe}
                section={'position'}
                updateSection={this.updateSection}
                max={max}
            />
        );
    };

    createCustomAttributeSection = () => {
        const {formatMessage} = this.props.intl;
        if (this.props.customProfileAttributeFields == null) {
            return <></>;
        }

        const attributeSections = this.props.customProfileAttributeFields.map((attribute) => {
            const sectionName = 'customAttribute_' + attribute.id;
            const active = this.props.activeSection === sectionName;
            let max = null;

            const getDisplayValue = (attributeValue: string | string[]) => {
                if (!attributeValue || (!Array.isArray(attributeValue) && !attributeValue.length)) {
                    return '';
                }

                if (attribute.type === 'select' || attribute.type === 'multiselect') {
                    const attribOptions = attribute.attrs.options;
                    if (!attribOptions) {
                        return '';
                    }
                    if (Array.isArray(attributeValue)) {
                        return attributeValue.map((value) => {
                            const option = attribOptions.find((o) => o.id === value);
                            if (option) {
                                return {label: option?.name, value: option?.id};
                            }
                            return null;
                        }).filter((value) => value != null);
                    }

                    // Handle single select
                    const option = attribOptions.find((o) => o.id === attributeValue);
                    if (option) {
                        return {label: option?.name, value: option?.id};
                    }
                    return '';
                }

                return attributeValue as string;
            };

            if (active) {
                const inputs = [];
                let extraInfo: JSX.Element|string;
                let submit = null;

                const validate = () => {
                    if (attribute.attrs?.value_type === 'email') {
                        const value = this.state.customAttributeValues[attribute.id] as string;
                        if (value && !isEmail(value)) {
                            return {
                                type: 'error' as const,
                                value: formatMessage(holders.validEmail),
                            };
                        }
                    }
                    if (attribute.attrs?.value_type === 'url') {
                        const value = this.state.customAttributeValues[attribute.id] as string;
                        if (value) {
                            const validURL = validHttpUrl(value);
                            if (!validURL) {
                                return {
                                    type: 'error' as const,
                                    value: formatMessage(holders.validUrl),
                                };
                            }
                        }
                    }
                    return undefined;
                };

                if ((this.props.user.auth_service === Constants.LDAP_SERVICE && attribute.attrs?.ldap) ||
                    (this.props.user.auth_service === Constants.SAML_SERVICE && attribute.attrs?.saml)) {
                    extraInfo = (
                        <span>
                            <FormattedMessage
                                id='user.settings.general.field_handled_externally'
                                defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                            />
                        </span>
                    );
                } else {
                    let attributeLabel: JSX.Element | string = (
                        attribute.name
                    );
                    if (this.props.isMobileView) {
                        attributeLabel = '';
                    }

                    if (attribute.type === 'select' || attribute.type === 'multiselect') {
                        const attribOptions: PropertyFieldOption[] = attribute.attrs!.options as PropertyFieldOption[];
                        const opts = attribOptions.map((o) => {
                            return {label: o.name, value: o.id} as SelectOption;
                        });
                        inputs.push(
                            <ReactSelect
                                isMulti={attribute.type === 'multiselect' ? true : undefined}
                                key={sectionName}
                                id={'customProfileAttribute_' + attribute.id}
                                inputId={'customProfileAttribute_' + attribute.id + '_input'}
                                className='react-select inlineSelect'
                                classNamePrefix='react-select'
                                options={opts}
                                isClearable={true}
                                isSearchable={false}
                                isDisabled={false}
                                placeholder={formatMessage({
                                    id: 'user.settings.general.select',
                                    defaultMessage: 'Select',
                                })}
                                components={{IndicatorSeparator: null}}
                                styles={selectStyles}
                                value={getDisplayValue(this.state.customAttributeValues[attribute.id]) as SelectOption}
                                onChange={(v, a) => this.updateSelectAttribute(v, a, attribute.id)}
                            />,
                        );
                    } else {
                        const inputType = attribute.type as string;
                        inputs.push(
                            <div
                                key={sectionName}
                                className='form-group'
                            >
                                <label className='col-sm-5 control-label'>{attributeLabel}</label>
                                <div className='col-sm-7'>
                                    <Input
                                        id={sectionName}
                                        name={sectionName}
                                        autoFocus={true}
                                        type={inputType}
                                        onChange={this.updateAttribute}
                                        value={getDisplayValue(this.state.customAttributeValues[attribute.id]) as string}
                                        maxLength={Constants.MAX_CUSTOM_ATTRIBUTE_LENGTH}
                                        autoCapitalize='off'
                                        onFocus={Utils.moveCursorToEnd}
                                        aria-label={attribute.name}
                                        validate={validate}
                                    />
                                </div>
                            </div>,
                        );
                    }
                    extraInfo = (
                        <span>
                            <FormattedMessage
                                id='user.settings.general.attributeExtra'
                                defaultMessage='This will be shown in your profile popover.'
                            />
                        </span>
                    );

                    submit = this.submitAttribute.bind(this, [attribute.id]);
                }

                max = (
                    <SettingItemMax
                        key={'settingItemMax_' + attribute.id}
                        title={attribute.name}
                        inputs={inputs}
                        submit={submit}
                        saving={this.state.sectionIsSaving}
                        serverError={this.state.serverError}
                        updateSection={this.updateSection}
                        extraInfo={extraInfo}
                        isValid={validate() === undefined}
                    />
                );
            }
            let describe: JSX.Element|string = '';
            if (this.props.user.custom_profile_attributes?.[attribute.id]) {
                const attributeValue = getDisplayValue(this.props.user.custom_profile_attributes?.[attribute.id]);
                if (attributeValue) {
                    if (typeof attributeValue === 'string') {
                        describe = attributeValue;
                    } else if (Array.isArray(attributeValue) && attributeValue.length > 0) {
                        describe = <FormattedList value={attributeValue.map((attrib) => attrib?.label || null)}/>;
                    } else if (!Array.isArray(attributeValue) && Object.hasOwn(attributeValue, 'label')) {
                        describe = attributeValue.label || '';
                    }
                }
            }
            if (!describe) {
                describe = (
                    <FormattedMessage
                        id='user.settings.general.emptyAttribute'
                        defaultMessage="Click 'Edit' to add your custom attribute"
                    />
                );
                if (this.props.isMobileView) {
                    describe = (
                        <FormattedMessage
                            id='user.settings.general.mobile.emptyAttribute'
                            defaultMessage='Click to add your custom attribute'
                        />
                    );
                }
            }

            return (
                <div key={sectionName}>
                    <SettingItem
                        key={'settingItem_' + attribute.id}
                        active={active}
                        areAllSectionsInactive={this.props.activeSection === ''}
                        title={attribute.name}
                        describe={describe}
                        section={sectionName}
                        updateSection={this.updateSection}
                        max={max}
                    />
                    <div className='divider-dark'/>
                </div>
            );
        });
        return <>{attributeSections}</>;
    };

    createPictureSection = () => {
        const user = this.props.user;
        const {formatMessage} = this.props.intl;

        const active = this.props.activeSection === 'picture';
        let max = null;

        if (active) {
            let submit = null;
            let setDefault = null;
            let helpText = null;
            let imgSrc = null;

            if ((this.props.user.auth_service === Constants.LDAP_SERVICE || this.props.user.auth_service === Constants.SAML_SERVICE) && this.props.ldapPictureAttributeSet) {
                helpText = (
                    <span>
                        <FormattedMessage
                            id='user.settings.general.field_handled_externally'
                            defaultMessage='This field is handled through your login provider. If you want to change it, you need to do so through your login provider.'
                        />
                    </span>
                );
            } else {
                submit = this.submitPicture;
                setDefault = user.last_picture_update > 0 ? this.setDefaultProfilePicture : null;
                imgSrc = Utils.imageURLForUser(user.id, user.last_picture_update);
                helpText = (
                    <FormattedMessage
                        id='setting_picture.help.profile'
                        defaultMessage='Upload a picture in BMP, JPG, JPEG, or PNG format. Maximum file size: {max}'
                        values={{max: Utils.fileSizeToString(this.props.maxFileSize)}}
                    />
                );
            }

            max = (
                <SettingPicture
                    title={formatMessage(holders.profilePicture)}
                    onSubmit={submit}
                    onSetDefault={setDefault}
                    src={imgSrc}
                    defaultImageSrc={Utils.defaultImageURLForUser(user.id)}
                    serverError={this.state.serverError}
                    clientError={this.state.pictureError}
                    updateSection={(e: React.MouseEvent) => {
                        this.updateSection('');
                        e.preventDefault();
                    }}
                    file={this.state.pictureFile}
                    onFileChange={this.updatePicture}
                    submitActive={this.submitActive}
                    loadingPicture={this.state.loadingPicture}
                    maxFileSize={this.props.maxFileSize}
                    helpText={helpText}
                />
            );
        }

        let minMessage: JSX.Element|string = formatMessage(holders.uploadImage);
        if (this.props.isMobileView) {
            minMessage = formatMessage(holders.uploadImageMobile);
        }
        if (user.last_picture_update > 0) {
            minMessage = (
                <FormattedMessage
                    id='user.settings.general.imageUpdated'
                    defaultMessage='Image last updated {date}'
                    values={{
                        date: (
                            <FormattedDate
                                value={new Date(user.last_picture_update)}
                                day='2-digit'
                                month='short'
                                year='numeric'
                            />
                        ),
                    }}
                />
            );
        }
        return (
            <>
                <SettingItem
                    active={active}
                    areAllSectionsInactive={this.props.activeSection === ''}
                    title={formatMessage(holders.profilePicture)}
                    describe={minMessage}
                    section={'picture'}
                    updateSection={this.updateSection}
                    max={max}
                />
                <div
                    className='sr-only'
                    aria-live='polite'
                    aria-atomic='true'
                >
                    {this.renderPictureStatus()}
                </div>
            </>
        );
    };

    renderPictureStatus = () => {
        if (this.state.loadingPicture) {
            return (
                <FormattedMessage
                    id='user.settings.general.picture.uploading'
                    defaultMessage='Uploading...'
                />
            );
        } else if (this.state.pictureFile) {
            return (
                <FormattedMessage
                    id='user.settings.general.picture.selected'
                    defaultMessage='Picture selected, ready to save'
                />
            );
        } else if (this.submitActive) {
            return (
                <FormattedMessage
                    id='user.settings.general.picture.uploaded'
                    defaultMessage='Picture uploaded'
                />
            );
        }
        return null;
    };

    render() {
        const nameSection = this.createNameSection();
        const nicknameSection = this.createNicknameSection();
        const usernameSection = this.createUsernameSection();
        const positionSection = this.createPositionSection();
        const emailSection = this.createEmailSection();
        const customAttributeSection = this.createCustomAttributeSection();
        const pictureSection = this.createPictureSection();

        return (
            <div
                id='profileSettings'
                aria-labelledby='profileButton'
                role='tabpanel'
            >
                <SettingMobileHeader
                    closeModal={this.props.closeModal}
                    collapseModal={this.props.collapseModal}
                    text={
                        <FormattedMessage
                            id='user.settings.modal.profile'
                            defaultMessage='Profile'
                        />
                    }
                />
                <div className='user-settings'>
                    <SettingDesktopHeader
                        id='generalSettingsTitle'
                        text={
                            <FormattedMessage
                                id='user.settings.modal.profile'
                                defaultMessage='Profile'
                            />
                        }
                    />
                    <div className='divider-dark first'/>
                    {nameSection}
                    <div className='divider-light'/>
                    {usernameSection}
                    <div className='divider-light'/>
                    {nicknameSection}
                    <div className='divider-light'/>
                    {positionSection}
                    <div className='divider-light'/>
                    {emailSection}
                    <div className='divider-light'/>
                    {customAttributeSection}
                    {pictureSection}
                    <div className='divider-dark'/>
                </div>
            </div>
        );
    }
}

export default injectIntl(UserSettingsGeneralTab);
