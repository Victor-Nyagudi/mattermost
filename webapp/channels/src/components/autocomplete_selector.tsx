// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useState} from 'react';

import type {Channel} from '@mattermost/types/channels';
import type {UserProfile} from '@mattermost/types/users';

import SuggestionBox from 'components/suggestion/suggestion_box';
import SuggestionList from 'components/suggestion/suggestion_list';

import type ModalSuggestionList from './suggestion/modal_suggestion_list';
import type Provider from './suggestion/provider';

export type Option = {
    text: string;
    value: string;
};
export type Selected = Option | UserProfile | Channel

export type Props = {
    id: string;
    providers: Provider[];
    value: string;
    onSelected?: (selected: Selected) => void;
    label?: React.ReactNode | string;
    labelClassName: string;
    inputClassName: string;
    helpText?: React.ReactNode | string;
    placeholder?: string;
    footer?: Node;
    disabled?: boolean;
    toggleFocus?: ((focus: boolean) => void) | null;
    listComponent: typeof SuggestionList | typeof ModalSuggestionList;
    listPosition: string;
};

type ChangeEvent = {
    target: HTMLInputElement;
}

const AutocompleteSelector = ({
    id = '',
    value = '',
    labelClassName = '',
    inputClassName = '',
    listComponent = SuggestionList,
    listPosition = 'top',
    ...props
}: Props) => {
    const [input, setInput] = useState('');
    const [isFocused, setIsFocused] = useState<boolean>();

    let suggestionRef: HTMLElement | undefined;

    const onChange = (e: ChangeEvent) => {
        if (!e || !e.target) {
            return;
        }

        setInput(e.target.value);
    };

    const handleSelected = (selected: Selected) => {
        setInput('');

        if (props.onSelected) {
            props.onSelected(selected);
        }

        requestAnimationFrame(() => {
            if (suggestionRef) {
                suggestionRef.blur();
            }
        });
    };

    const setSuggestionRef = (ref: HTMLElement) => {
        suggestionRef = ref;
    };

    const onFocus = () => {
        setIsFocused(true);

        if (props.toggleFocus) {
            props.toggleFocus(true);
        }
    };

    const onBlur = () => {
        setIsFocused(false);

        if (props.toggleFocus) {
            props.toggleFocus(false);
        }
    };

    const {
        providers,
        placeholder,
        footer,
        label,
        helpText,
        disabled,
    } = props;

    const isSelectorFocused = isFocused;
    let currentInput = input;

    if (!isSelectorFocused) {
        currentInput = value;
    }

    let labelContent;
    if (label) {
        labelContent = (
            <label
                className={'control-label ' + labelClassName}
            >
                {label}
            </label>
        );
    }

    let helpTextContent;
    if (helpText) {
        helpTextContent = (
            <div className='help-text'>
                {helpText}
            </div>
        );
    }

    return (
        <div
            data-testid='autoCompleteSelector'
            className='form-group'
        >
            {labelContent}
            <div className={inputClassName}>
                <SuggestionBox
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    ref={setSuggestionRef}
                    placeholder={placeholder}
                    listComponent={listComponent}
                    className='form-control'
                    containerClass='select-suggestion-container'
                    value={currentInput}
                    onChange={onChange}
                    onItemSelected={handleSelected}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    providers={providers}
                    completeOnTab={true}
                    renderNoResults={true}
                    openOnFocus={true}
                    openWhenEmpty={true}
                    replaceAllInputOnSelect={true}
                    disabled={disabled}
                    listPosition={listPosition}
                />
                {helpTextContent}
                {footer}
            </div>
        </div>
    );
};

export default AutocompleteSelector;
