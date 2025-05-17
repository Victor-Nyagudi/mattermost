// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import {renderWithContext} from 'tests/react_testing_utils';

import AutocompleteSelector from './autocomplete_selector';
import type {Props} from './autocomplete_selector';
import SuggestionList from './suggestion/suggestion_list';

const buttonText = {
    onToggleFocusTrue: 'Fire props.ToggleFocus(true) function',
    onToggleFocusFalse: 'Fire props.ToggleFocus(false) function',
    handleSelected: 'Fire handleSelected function',
};

jest.mock('./suggestion/suggestion_box', () => ({
    __esModule: true,
    default: jest.fn((props) => {
        return (
            <div>
                <button onClick={props.onFocus}>{buttonText.onToggleFocusTrue}</button>
                <button onClick={props.onBlur}>{buttonText.onToggleFocusFalse}</button>
                <button onClick={props.onItemSelected}>{buttonText.handleSelected}</button>
            </div>
        );
    }),
}));

describe('components/widgets/settings/AutocompleteSelector', () => {
    const baseProps: Props = {
        id: 'string.id',
        label: 'some label',
        value: 'some value',
        providers: [],
        labelClassName: 'some label class name',
        inputClassName: 'some input class name',
        listComponent: SuggestionList,
        listPosition: 'top',
        toggleFocus: jest.fn(),
        onSelected: jest.fn(),
    };

    test('toggleFocus function prop is called on focus', () => {
        const {getByRole} = renderWithContext(<AutocompleteSelector {...baseProps}/>);

        getByRole('button', {name: `${buttonText.onToggleFocusTrue}`}).click();

        expect(baseProps.toggleFocus).toHaveBeenCalledTimes(1);
        expect(baseProps.toggleFocus).toHaveBeenCalledWith(true);
    });

    test('toggleFocus function prop is called on blur', () => {
        const {getByRole} = renderWithContext(<AutocompleteSelector {...baseProps}/>);

        getByRole('button', {name: `${buttonText.onToggleFocusFalse}`}).click();

        expect(baseProps.toggleFocus).toHaveBeenCalledTimes(1);
        expect(baseProps.toggleFocus).toHaveBeenCalledWith(false);
    });

    test('onSelected function is called when item is selected', () => {
        const {getByRole} = renderWithContext(<AutocompleteSelector {...baseProps}/>);

        getByRole('button', {name: `${buttonText.handleSelected}`}).click();

        expect(baseProps.onSelected).toHaveBeenCalledTimes(1);
    });
});
